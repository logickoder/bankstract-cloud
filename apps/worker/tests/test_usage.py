# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from bankstract_cloud.audit import AuditEntry
from tests.conftest import Harness, auth_header


def test_admin_usage_requires_admin(harness: Harness) -> None:
    assert harness.client.get("/v1/admin/usage?owner=u1").status_code == 401


def test_admin_usage_aggregates_by_owner(harness: Harness) -> None:
    created = harness.client.post(
        "/v1/keys",
        json={"name": "k", "env": "test", "owner": "u1"},
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
