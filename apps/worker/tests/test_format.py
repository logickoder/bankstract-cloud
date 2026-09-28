# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from decimal import Decimal

import pytest
from bankstract import ParseResult

from tests.conftest import Harness, auth_header, fake_parse, pdf_upload, txn

_RESULT = ParseResult(
    transactions=[txn(credit="500.00")],
    total_credit=Decimal("500.00"),
    total_debit=Decimal("0"),
)


def test_parse_format_csv_round_trip(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    # Real reconcile_result + serialize run on the faked parse.
    monkeypatch.setattr("bankstract.parse", fake_parse(result=_RESULT))

    resp = harness.client.post(
        "/v1/parse?format=csv",
        files=pdf_upload(),
        headers=auth_header(harness.test_key),
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    assert "attachment" in resp.headers["content-disposition"]
    body = resp.text
    assert "FOO TRANSFER" in body
    assert "500.00" in body  # money rendered verbatim, not as float


def test_parse_format_unknown_returns_422(harness: Harness) -> None:
    resp = harness.client.post(
        "/v1/parse?format=xml",
        files=pdf_upload(),
        headers=auth_header(harness.test_key),
    )
    assert resp.status_code == 422


def test_parse_format_json_is_default(harness: Harness) -> None:
    # No format param → JSON path → synthetic PDF is unsupported → 422 from engine.
    resp = harness.client.post(
        "/v1/parse",
        files=pdf_upload(),
        headers=auth_header(harness.test_key),
    )
    assert resp.status_code == 422
