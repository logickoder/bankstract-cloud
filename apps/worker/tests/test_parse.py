# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from tests.conftest import Harness, auth_header, pdf_upload


def test_parse_requires_api_key(harness: Harness) -> None:
    resp = harness.client.post("/v1/parse", files=pdf_upload())
    assert resp.status_code == 401


def test_parse_rejects_invalid_key(harness: Harness) -> None:
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header("bsk_test_nope")
    )
    assert resp.status_code == 401


def test_parse_unsupported_pdf_returns_422(harness: Harness) -> None:
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["error_class"] == "ParseError"
    assert "error" in body


def test_parse_oversize_returns_413(harness: Harness) -> None:
    big = b"%PDF-1.4\n" + b"0" * 4000
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(big), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 413


def test_anonymous_demo_key_rate_limited(harness: Harness) -> None:
    # DEMO_RATE_LIMIT_MAX=5 in the harness. Sixth call within the window = 429.
    seen_429 = False
    for _ in range(7):
        resp = harness.client.post(
            "/v1/parse", files=pdf_upload(), headers=auth_header(harness.demo_key)
        )
        if resp.status_code == 429:
            seen_429 = True
            break
        assert resp.status_code == 422  # unsupported pdf, but auth + limit passed
    assert seen_429


def test_banks_lists_engine_parsers(harness: Harness) -> None:
    resp = harness.client.get("/v1/banks", headers=auth_header(harness.test_key))
    assert resp.status_code == 200
    body = resp.json()
    ids = {b["id"] for b in body["banks"]}
    assert "fbn" in ids
    assert body["engine_version"]


def test_usage_starts_at_zero(harness: Harness) -> None:
    # test_key has no owner/subscription: no tier, no cap, no overage.
    resp = harness.client.get("/v1/usage", headers=auth_header(harness.test_key))
    assert resp.status_code == 200
    body = resp.json()
    assert body["period_parses"] == 0
    assert body["tier"] is None
    assert body["monthly_cap"] is None
    assert body["overage_parses"] == 0
    assert body["projected_overage_naira"] == "0.00"
