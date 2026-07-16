# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from collections.abc import Callable
from types import SimpleNamespace

import pytest
from bankstract import ProgressCallback

from tests.conftest import Harness, auth_header, pdf_upload


def _success_parse() -> Callable[..., SimpleNamespace]:
    # Minimal stand-in for bankstract.parse: succeeds so the parse records a success (which the
    # test-tier cap counts), without a real statement PDF.
    def _impl(
        source: object,
        *,
        bank: str | None = None,
        progress_callback: ProgressCallback | None = None,
    ) -> SimpleNamespace:
        return SimpleNamespace(transactions=[], metadata=None)

    return _impl


def _success_parse_to(
    source: object,
    *,
    format: str = "csv",
    bank: str | None = None,
    reconcile: bool = True,
    progress_callback: ProgressCallback | None = None,
) -> bytes:
    return b"date\n2026-01-01\n"


def _owner_test_key(harness: Harness, owner: str) -> str:
    return harness.client.app.state.app_state.keystore.issue("t", "test", owner=owner).raw_key


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


def test_anonymous_demo_over_cap_serves_sample(harness: Harness) -> None:
    # DEMO_RATE_LIMIT_MAX=5 (per IP, counts every attempt). The synthetic pdf fails to parse (422)
    # but each attempt still spends the budget; over cap serves the canned sample, no engine.
    saw_sample = False
    for _ in range(7):
        resp = harness.client.post(
            "/v1/parse", files=pdf_upload(), headers=auth_header(harness.demo_key)
        )
        if resp.status_code == 200:
            assert resp.headers["X-Bankstract-Sample"] == "true"
            body = resp.json()
            assert body["_sample"]["reason"]
            assert body["transactions"]  # canned sample rows, not the caller's file
            saw_sample = True
            break
        assert resp.status_code == 422  # within cap: engine ran, unsupported pdf
    assert saw_sample


def test_test_key_over_cap_serves_sample(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    # TEST_TIER_MONTHLY_CAP=3. A test key with an owner gets 3 real parses, then the canned sample.
    monkeypatch.setattr("bankstract.parse", _success_parse())
    key = _owner_test_key(harness, "owner_cap")
    for _ in range(3):
        resp = harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(key))
        assert resp.status_code == 200
        assert "_sample" not in resp.json()  # real parse, clean
    over = harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(key))
    assert over.status_code == 200
    assert over.headers["X-Bankstract-Sample"] == "true"
    assert over.json()["_sample"]["reason"]


def test_test_cap_survives_regenerate(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    # The cap is per-owner: rolling the test key (a fresh key id) must NOT reset the count, or an
    # owner could regenerate to mint another 25 free parses (the bypass the review caught).
    monkeypatch.setattr("bankstract.parse", _success_parse())
    admin = auth_header(harness.admin_token)
    first = harness.client.post("/v1/keys/test", json={"owner": "o_regen"}, headers=admin).json()
    for _ in range(3):
        assert (
            harness.client.post(
                "/v1/parse", files=pdf_upload(), headers=auth_header(first["key"])
            ).status_code
            == 200
        )
    # Roll to a fresh key id for the same owner, then parse: still capped.
    second = harness.client.post("/v1/keys/test", json={"owner": "o_regen"}, headers=admin).json()
    over = harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(second["key"]))
    assert over.status_code == 200
    assert over.headers["X-Bankstract-Sample"] == "true"


def test_test_key_failed_parses_do_not_count(harness: Harness) -> None:
    # Real engine on the synthetic pdf fails (422). Failures never accrue toward the cap, so the
    # key keeps returning 422 (never the canned sample) past the cap count.
    key = _owner_test_key(harness, "owner_fail")
    for _ in range(5):  # > TEST_TIER_MONTHLY_CAP (3)
        resp = harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(key))
        assert resp.status_code == 422


def test_test_key_csv_over_cap_serves_sample_csv(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("bankstract.parse_to", _success_parse_to)
    key = _owner_test_key(harness, "owner_csv")
    for _ in range(3):
        assert (
            harness.client.post(
                "/v1/parse?format=csv", files=pdf_upload(), headers=auth_header(key)
            ).status_code
            == 200
        )
    over = harness.client.post("/v1/parse?format=csv", files=pdf_upload(), headers=auth_header(key))
    assert over.status_code == 200
    assert over.headers["X-Bankstract-Sample"] == "true"
    assert over.content.startswith(b"# bankstract free tier limit reached")


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
