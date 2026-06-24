# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import pytest

from tests.conftest import Harness, auth_header, pdf_upload

_FAKE_CSV = (
    b"date,narration,debit,credit,balance,reference,currency\n"
    b"2026-01-05T09:30:00,FOO TRANSFER,0,500.00,600.00,REF1,NGN\n"
)


def _fake_parse_to(payload: bytes):  # type: ignore[no-untyped-def]
    def _impl(
        source: object,
        *,
        format: str = "csv",
        bank: str | None = None,
        reconcile: bool = True,
        progress_callback: object = None,
    ):  # type: ignore[no-untyped-def]
        return payload

    return _impl


def test_engine_parse_to_resolves() -> None:
    # Guards against an engine reshuffle dropping the parse+serialize entrypoint.
    import bankstract

    assert callable(bankstract.parse_to)


def test_parse_format_csv_round_trip(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bankstract.parse_to", _fake_parse_to(_FAKE_CSV))

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
