# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import pytest
from bankstract import (
    EmptyStatementError,
    EncryptedSourceError,
    LayoutDriftError,
)

from tests.conftest import Harness, auth_header, pdf_upload

_ENVELOPE_KEYS = {"error", "error_class", "format_version", "marker_coverage"}


def _raise_on_parse(monkeypatch: pytest.MonkeyPatch, exc: Exception) -> None:
    def _raise(source: object, *, bank: str | None = None, progress_callback: object = None):  # type: ignore[no-untyped-def]
        raise exc

    monkeypatch.setattr("bankstract.parse", _raise)


def test_unsupported_envelope_has_all_keys(harness: Harness) -> None:
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 422
    assert set(resp.json()) == _ENVELOPE_KEYS


def test_empty_statement_surfaces_name_and_marker_coverage(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    _raise_on_parse(
        monkeypatch,
        EmptyStatementError("no rows", format_version="fbn-2026-01", marker_coverage=0.97),
    )
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["error_class"] == "EmptyStatementError"
    assert body["format_version"] == "fbn-2026-01"
    assert body["marker_coverage"] == 0.97


def test_encrypted_source_surfaces_name(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    _raise_on_parse(monkeypatch, EncryptedSourceError("password protected"))
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 422
    assert resp.json()["error_class"] == "EncryptedSourceError"


def test_encrypted_real_fixture_auto_detect(harness: Harness, encrypted_pdf: bytes) -> None:
    # Real engine fixture through the auto-detect path (no bank). Engine 0.14+ raises
    # EncryptedSourceError during auto-detect itself, so the worker surfaces it directly
    # (no bytes-sniffing workaround) and the client can show the password path.
    resp = harness.client.post(
        "/v1/parse",
        files={"pdf": ("statement.pdf", encrypted_pdf, "application/pdf")},
        headers=auth_header(harness.test_key),
    )
    assert resp.status_code == 422
    assert resp.json()["error_class"] == "EncryptedSourceError"


def test_layout_drift_surfaces_name(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    _raise_on_parse(monkeypatch, LayoutDriftError("structure broke", format_version="opay-x"))
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["error_class"] == "LayoutDriftError"
    assert body["format_version"] == "opay-x"


def test_401_unified_envelope(harness: Harness) -> None:
    resp = harness.client.post("/v1/parse", files=pdf_upload())
    assert resp.status_code == 401
    body = resp.json()
    assert set(body) == _ENVELOPE_KEYS
    assert body["error_class"] == "AuthError"
    assert body["marker_coverage"] is None


def test_413_unified_envelope(harness: Harness) -> None:
    big = b"%PDF-1.4\n" + b"0" * 4000
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(big), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 413
    assert resp.json()["error_class"] == "PayloadTooLarge"
