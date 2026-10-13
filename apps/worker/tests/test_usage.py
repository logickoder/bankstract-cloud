# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from bankstract_cloud.audit import AuditEntry, AuditLog, current_period_start_iso
from tests.conftest import Harness, auth_header


def test_owner_usage_tier_filter_excludes_free_parses(harness: Harness) -> None:
    # The overage/billing consumers pass tier="live": a first_party (or test) parse under the
    # same owner must never inflate the count an invoice is computed from.
    state = harness.client.app.state.app_state
    live = state.keystore.issue("prod", "live", owner="mix")
    fp = state.keystore.issue("fp", "first_party", owner="mix")
    for key_id in (live.id, fp.id):
        state.audit.record(
            AuditEntry(
                api_key_id=key_id,
                filename="a.pdf",
                byte_count=1,
                parser_detected="fbn",
                success=True,
                error_class=None,
            )
        )
    since = current_period_start_iso()
    _total, all_ok, _daily = state.audit.owner_usage("mix", since_iso=since)
    _lt, live_ok, _ld = state.audit.owner_usage("mix", since_iso=since, tier="live")
    assert all_ok == 2
    assert live_ok == 1


def test_admin_usage_requires_admin(harness: Harness) -> None:
    assert harness.client.get("/v1/admin/usage?owner=u1").status_code == 401


def test_admin_usage_aggregates_by_owner(harness: Harness) -> None:
    created = harness.client.post(
        "/v1/keys/test",
        json={"owner": "u1"},
        headers=auth_header(harness.admin_token),
    ).json()
    audit = harness.client.app.state.app_state.audit
    audit.record(
        AuditEntry(
            api_key_id=created["id"],
            filename="a.pdf",
            byte_count=10,
            parser_detected="fbn",
            success=True,
            error_class=None,
        )
    )
    audit.record(
        AuditEntry(
            api_key_id=created["id"],
            filename="b.pdf",
            byte_count=10,
            parser_detected=None,
            success=False,
            error_class="ParseError",
        )
    )

    body = harness.client.get(
        "/v1/admin/usage?owner=u1", headers=auth_header(harness.admin_token)
    ).json()
    assert body["owner"] == "u1"
    assert body["period_parses"] == 1  # one success out of two attempts
    assert body["success_rate"] == 0.5
    # pad_daily fills the whole billing cycle; exactly one day has a non-zero count.
    assert sum(d["count"] for d in body["daily"]) == 1
    assert any(d["count"] == 1 for d in body["daily"])


def test_admin_usage_excludes_other_owners(harness: Harness) -> None:
    body = harness.client.get(
        "/v1/admin/usage?owner=nobody", headers=auth_header(harness.admin_token)
    ).json()
    assert body["period_parses"] == 0
    # pad_daily fills the full cycle with zeros; no owner = all zeros.
    assert all(d["count"] == 0 for d in body["daily"])


def _record(
    audit: AuditLog, key_id: str, *, success: bool, error_class: str | None, filename: str
) -> None:
    audit.record(
        AuditEntry(
            api_key_id=key_id,
            filename=filename,
            byte_count=10,
            parser_detected=None,
            success=success,
            error_class=error_class,
        )
    )


def test_admin_usage_groups_refusals_by_error_class(harness: Harness) -> None:
    state = harness.client.app.state.app_state
    mine = state.keystore.issue("prod", "live", owner="refuser")
    other = state.keystore.issue("other", "live", owner="someone-else")
    audit = state.audit
    _record(audit, mine.id, success=True, error_class=None, filename="ok.pdf")
    _record(audit, mine.id, success=False, error_class="ReconciliationError", filename="a.pdf")
    _record(audit, mine.id, success=False, error_class="ReconciliationError", filename="b.pdf")
    _record(audit, mine.id, success=False, error_class="LayoutDriftError", filename="c.pdf")
    # A failure with no recorded class still counts, under a stable label.
    _record(audit, mine.id, success=False, error_class=None, filename="d.pdf")
    # Another owner's failures never leak in.
    _record(audit, other.id, success=False, error_class="EncryptedSourceError", filename="x.pdf")

    res = harness.client.get(
        "/v1/admin/usage?owner=refuser", headers=auth_header(harness.admin_token)
    )
    body = res.json()
    assert body["refusals"] == [
        {"error_class": "ReconciliationError", "count": 2},
        {"error_class": "LayoutDriftError", "count": 1},
        {"error_class": "unknown", "count": 1},
    ]
    # Metadata only: counts per class. No filename ever rides along (docs/rules/privacy.md).
    for name in ("a.pdf", "b.pdf", "c.pdf", "d.pdf", "x.pdf"):
        assert name not in res.text


def test_admin_usage_refusals_empty_when_nothing_failed(harness: Harness) -> None:
    state = harness.client.app.state.app_state
    key = state.keystore.issue("prod", "live", owner="clean")
    _record(state.audit, key.id, success=True, error_class=None, filename="ok.pdf")
    body = harness.client.get(
        "/v1/admin/usage?owner=clean", headers=auth_header(harness.admin_token)
    ).json()
    assert body["refusals"] == []
