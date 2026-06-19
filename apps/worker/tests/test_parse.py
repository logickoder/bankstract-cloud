# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from tests.conftest import Harness
from tests.fixtures import MINIMAL_PDF


def _auth(key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {key}"}


def _pdf(data: bytes = MINIMAL_PDF) -> dict[str, tuple[str, bytes, str]]:
    return {"pdf": ("statement.pdf", data, "application/pdf")}


def test_parse_requires_api_key(harness: Harness) -> None:
    resp = harness.client.post("/v1/parse", files=_pdf())
    assert resp.status_code == 401


def test_parse_rejects_invalid_key(harness: Harness) -> None:
    resp = harness.client.post("/v1/parse", files=_pdf(), headers=_auth("bsk_test_nope"))
    assert resp.status_code == 401


def test_parse_unsupported_pdf_returns_422(harness: Harness) -> None:
    resp = harness.client.post("/v1/parse", files=_pdf(), headers=_auth(harness.test_key))
    assert resp.status_code == 422


def test_parse_oversize_returns_413(harness: Harness) -> None:
    big = b"%PDF-1.4\n" + b"0" * 4000
    resp = harness.client.post("/v1/parse", files=_pdf(big), headers=_auth(harness.test_key))
    assert resp.status_code == 413


def test_anonymous_demo_key_rate_limited(harness: Harness) -> None:
    # DEMO_RATE_LIMIT_MAX=5 in the harness. Sixth call within the window = 429.
    seen_429 = False
    for _ in range(7):
        resp = harness.client.post("/v1/parse", files=_pdf(), headers=_auth(harness.demo_key))
        if resp.status_code == 429:
            seen_429 = True
            break
        assert resp.status_code == 422  # unsupported pdf, but auth + limit passed
    assert seen_429


def test_banks_lists_engine_parsers(harness: Harness) -> None:
    resp = harness.client.get("/v1/banks", headers=_auth(harness.test_key))
    assert resp.status_code == 200
    body = resp.json()
    ids = {b["id"] for b in body["banks"]}
    assert "fbn" in ids
    assert body["engine_version"]


def test_usage_starts_at_zero(harness: Harness) -> None:
    resp = harness.client.get("/v1/usage", headers=_auth(harness.test_key))
    assert resp.status_code == 200
    body = resp.json()
    assert body["period_parses"] == 0
    assert body["projected_invoice_usd"] == "0.00"
