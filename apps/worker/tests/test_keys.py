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
    # The raw key never appears again. List returns only the prefix.
    listed = harness.client.get("/v1/keys", headers=auth_header(harness.admin_token)).json()
    issued = next(k for k in listed["keys"] if k["id"] == body["id"])
    assert "key" not in issued
    assert issued["prefix"] == body["prefix"]


def test_list_filters_by_owner(harness: Harness) -> None:
    admin = auth_header(harness.admin_token)
    body_a = {"name": "a", "env": "live", "owner": "user_1"}
    body_b = {"name": "b", "env": "live", "owner": "user_2"}
    harness.client.post("/v1/keys", json=body_a, headers=admin)
    harness.client.post("/v1/keys", json=body_b, headers=admin)
    resp = harness.client.get("/v1/keys?owner=user_1", headers=admin)
    names = [k["name"] for k in resp.json()["keys"]]
    assert names == ["a"]


def test_revoke_is_soft_delete(harness: Harness) -> None:
    admin = auth_header(harness.admin_token)
    created = harness.client.post(
        "/v1/keys", json={"name": "temp", "env": "live"}, headers=admin
    ).json()

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
    created = harness.client.post(
        "/v1/keys", json={"name": "revoke-me", "env": "live"}, headers=admin
    ).json()
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


def test_create_rejects_test_env(harness: Harness) -> None:
    # Test keys are one-per-owner via /v1/keys/test; the generic create is live-only.
    resp = harness.client.post(
        "/v1/keys", json={"name": "x", "env": "test"}, headers=auth_header(harness.admin_token)
    )
    assert resp.status_code == 409


def test_roll_test_key_keeps_one_active(harness: Harness) -> None:
    admin = auth_header(harness.admin_token)
    first = harness.client.post("/v1/keys/test", json={"owner": "u_roll"}, headers=admin)
    assert first.status_code == 201
    assert first.json()["key"].startswith("bsk_test_")
    assert first.json()["tier"] == "test"

    # Roll again: a fresh key, and exactly one active test key remains for the owner.
    second = harness.client.post("/v1/keys/test", json={"owner": "u_roll"}, headers=admin)
    assert second.status_code == 201
    assert second.json()["key"] != first.json()["key"]

    listed = harness.client.get("/v1/keys?owner=u_roll", headers=admin).json()["keys"]
    active_test = [k for k in listed if k["tier"] == "test" and k["revoked_at"] is None]
    assert len(active_test) == 1
    assert active_test[0]["id"] == second.json()["id"]

    # The rolled-away key no longer authenticates.
    old = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(first.json()["key"])
    )
    assert old.status_code == 401


def test_roll_test_key_requires_admin(harness: Harness) -> None:
    assert harness.client.post("/v1/keys/test", json={"owner": "u"}).status_code == 401
