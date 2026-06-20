# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from tests.conftest import Harness, auth_header, pdf_upload


def test_issue_returns_raw_key_once(harness: Harness) -> None:
    resp = harness.client.post(
        "/v1/keys",
        json={"name": "acme prod", "env": "live"},
        headers=auth_header(harness.admin_token),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["key"].startswith("bsk_live_")
    assert body["tier"] == "live"
    assert body["prefix"] == body["key"][:16]
    # The raw key never appears again — list returns only the prefix.
    listed = harness.client.get("/v1/keys", headers=auth_header(harness.admin_token)).json()
    issued = next(k for k in listed["keys"] if k["id"] == body["id"])
    assert "key" not in issued
    assert issued["prefix"] == body["prefix"]


def test_list_filters_by_owner(harness: Harness) -> None:
    admin = auth_header(harness.admin_token)
    harness.client.post("/v1/keys", json={"name": "a", "owner": "user_1"}, headers=admin)
    harness.client.post("/v1/keys", json={"name": "b", "owner": "user_2"}, headers=admin)
    resp = harness.client.get("/v1/keys?owner=user_1", headers=admin)
    names = [k["name"] for k in resp.json()["keys"]]
    assert names == ["a"]


def test_revoke_is_soft_delete(harness: Harness) -> None:
    admin = auth_header(harness.admin_token)
    created = harness.client.post("/v1/keys", json={"name": "temp"}, headers=admin).json()

    revoke = harness.client.delete(f"/v1/keys/{created['id']}", headers=admin)
    assert revoke.status_code == 204

    # Still listed (audit trail), now with revoked_at set.
    listed = harness.client.get("/v1/keys", headers=admin).json()
    row = next(k for k in listed["keys"] if k["id"] == created["id"])
    assert row["revoked_at"] is not None

    # Revoking again finds no active key → 404.
    assert harness.client.delete(f"/v1/keys/{created['id']}", headers=admin).status_code == 404


def test_revoked_key_cannot_authenticate(harness: Harness) -> None:
    admin = auth_header(harness.admin_token)
    created = harness.client.post("/v1/keys", json={"name": "revoke-me"}, headers=admin).json()
    harness.client.delete(f"/v1/keys/{created['id']}", headers=admin)
    # The revoked key is rejected by the parse endpoint.
    resp = harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(created["key"]))
    assert resp.status_code == 401


def test_admin_auth_required(harness: Harness) -> None:
    assert harness.client.post("/v1/keys", json={"name": "x"}).status_code == 401
    assert (
        harness.client.post(
            "/v1/keys", json={"name": "x"}, headers=auth_header("wrong-token")
        ).status_code
        == 401
    )


def test_key_management_disabled_without_token(harness_no_admin: Harness) -> None:
    # Empty admin token = feature off. Must be 403, never an open door.
    resp = harness_no_admin.client.post(
        "/v1/keys", json={"name": "x"}, headers=auth_header("anything")
    )
    assert resp.status_code == 403
