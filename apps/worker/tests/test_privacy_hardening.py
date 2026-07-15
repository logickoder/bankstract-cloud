# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from bankstract_cloud.audit import AuditEntry
from bankstract_cloud.clock import utcnow_iso
from bankstract_cloud.paystack import PaystackError
from tests.conftest import Harness, auth_header, pdf_upload


def _record(harness: Harness, api_key_id: str) -> None:
    harness.client.app.state.app_state.audit.record(
        AuditEntry(
            api_key_id=api_key_id,
            filename="x.pdf",
            byte_count=1,
            parser_detected=None,
            success=True,
            error_class=None,
        )
    )


# --- Phase 2: demo IP is hashed, never stored raw ---


def test_demo_rate_limit_bucket_is_hashed(harness: Harness) -> None:
    # A demo request spends the rate budget before parsing, so a bucket row exists regardless of
    # the parse outcome. The stored key must be a hash, never the raw client host.
    harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(harness.demo_key))
    conn = harness.client.app.state.app_state.conn
    rows = conn.execute("SELECT bucket FROM rate_limit").fetchall()
    assert rows
    for row in rows:
        bucket = row["bucket"]
        assert bucket.startswith("demo:")
        assert "testclient" not in bucket  # not the raw request.client.host
        digest = bucket.split(":", 1)[1]
        assert len(digest) == 32
        assert all(c in "0123456789abcdef" for c in digest)


# --- Phase 3: audit retention purge ---


def test_purge_older_than_respects_window(harness: Harness) -> None:
    state = harness.client.app.state.app_state
    old_ts = (datetime.now(UTC) - timedelta(days=200)).isoformat()
    state.conn.execute(
        "INSERT INTO audit_log (id, timestamp, api_key_id, filename, byte_count, "
        "parser_detected, success, error_class) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ("old-row", old_ts, "k", None, 1, None, 1, None),
    )
    state.conn.commit()
    _record(harness, "k")  # a fresh row (now)

    removed = state.audit.purge_older_than(90)
    assert removed == 1
    remaining = state.conn.execute("SELECT COUNT(*) AS n FROM audit_log").fetchone()["n"]
    assert remaining == 1

    # days <= 0 disables the purge.
    assert state.audit.purge_older_than(0) == 0


# --- Phase 4: owner erasure ---


def _issue_key(harness: Harness, owner: str) -> str:
    res = harness.client.post(
        "/v1/keys",
        json={"name": owner, "env": "test", "owner": owner},
        headers=auth_header(harness.admin_token),
    )
    return res.json()["id"]


def test_delete_owner_requires_admin(harness: Harness) -> None:
    assert harness.client.delete("/v1/admin/owner?owner=u1").status_code == 401


def test_purge_owner_scopes_to_owner(harness: Harness) -> None:
    k1 = _issue_key(harness, "u1")
    k2 = _issue_key(harness, "u2")
    _record(harness, k1)
    _record(harness, k2)

    res = harness.client.delete(
        "/v1/admin/owner?owner=u1", headers=auth_header(harness.admin_token)
    )
    assert res.status_code == 200

    conn = harness.client.app.state.app_state.conn

    def keys_for(owner: str) -> int:
        return conn.execute(
            "SELECT COUNT(*) AS n FROM api_keys WHERE owner = ?", (owner,)
        ).fetchone()["n"]

    assert keys_for("u1") == 0
    assert keys_for("u2") == 1
    audit = harness.client.app.state.app_state.audit
    assert audit.count_success_for_key(k1, since_iso="1970-01-01") == 0
    assert audit.count_success_for_key(k2, since_iso="1970-01-01") == 1


def _insert_sub(harness: Harness, owner: str, *, status: str, code: str | None) -> None:
    harness.client.app.state.app_state.conn.execute(
        "INSERT INTO subscriptions (owner, customer_code, subscription_code, status, updated_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (owner, f"CUS_{owner}", code, status, utcnow_iso()),
    )
    harness.client.app.state.app_state.conn.commit()


def _insert_active_sub(harness: Harness, owner: str) -> None:
    _insert_sub(harness, owner, status="active", code=f"SUB_{owner}")


def test_erasure_cancels_active_subscription(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    _issue_key(harness, "u3")
    _insert_active_sub(harness, "u3")

    called: list[str] = []

    async def _ok(code: str) -> None:
        called.append(code)

    monkeypatch.setattr(harness.client.app.state.app_state.paystack, "disable_subscription", _ok)

    res = harness.client.delete(
        "/v1/admin/owner?owner=u3", headers=auth_header(harness.admin_token)
    )
    assert res.status_code == 200
    assert called == ["SUB_u3"]  # the live subscription was cancelled
    conn = harness.client.app.state.app_state.conn
    subs = conn.execute("SELECT COUNT(*) AS n FROM subscriptions WHERE owner = 'u3'").fetchone()[
        "n"
    ]
    assert subs == 0


def test_erasure_aborts_when_cancel_fails(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    _issue_key(harness, "u4")
    _insert_active_sub(harness, "u4")

    async def _fail(code: str) -> None:
        raise PaystackError("boom")

    monkeypatch.setattr(harness.client.app.state.app_state.paystack, "disable_subscription", _fail)

    res = harness.client.delete(
        "/v1/admin/owner?owner=u4", headers=auth_header(harness.admin_token)
    )
    assert res.status_code == 502
    # Nothing deleted: a live charge is never orphaned.
    conn = harness.client.app.state.app_state.conn
    subs = conn.execute("SELECT COUNT(*) AS n FROM subscriptions WHERE owner = 'u4'").fetchone()[
        "n"
    ]
    keys = conn.execute("SELECT COUNT(*) AS n FROM api_keys WHERE owner = 'u4'").fetchone()["n"]
    assert subs == 1
    assert keys == 1


def test_erasure_cancels_inactive_but_coded_subscription(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Locally inactive (a failed renewal deactivated us) but Paystack may still be live and
    # retrying the card, so the cancel must still fire whenever a subscription_code exists.
    _issue_key(harness, "u5")
    _insert_sub(harness, "u5", status="inactive", code="SUB_u5")

    called: list[str] = []

    async def _ok(code: str) -> None:
        called.append(code)

    monkeypatch.setattr(harness.client.app.state.app_state.paystack, "disable_subscription", _ok)

    res = harness.client.delete(
        "/v1/admin/owner?owner=u5", headers=auth_header(harness.admin_token)
    )
    assert res.status_code == 200
    assert called == ["SUB_u5"]


def test_erasure_aborts_active_without_code(harness: Harness) -> None:
    # Active locally but no subscription_code to cancel with: refuse rather than orphan a charge.
    _issue_key(harness, "u6")
    _insert_sub(harness, "u6", status="active", code=None)

    res = harness.client.delete(
        "/v1/admin/owner?owner=u6", headers=auth_header(harness.admin_token)
    )
    assert res.status_code == 409
    conn = harness.client.app.state.app_state.conn
    keys = conn.execute("SELECT COUNT(*) AS n FROM api_keys WHERE owner = 'u6'").fetchone()["n"]
    assert keys == 1  # nothing purged
