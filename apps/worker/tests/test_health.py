# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from tests.conftest import Harness


def test_healthz(harness: Harness) -> None:
    resp = harness.client.get("/healthz")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_readyz(harness: Harness) -> None:
    resp = harness.client.get("/readyz")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["engine"] is True
    assert body["database"] is True


def test_status_reports_versions(harness: Harness) -> None:
    resp = harness.client.get("/v1/status")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["worker_version"]
    assert body["engine_version"]
