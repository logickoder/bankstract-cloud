# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from typing import Literal

import pytest

from tests.conftest import Harness
from tests.fixtures import MINIMAL_PDF

PDF_MEDIA = "application/pdf"
XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _auth(key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {key}"}


def _pdf(data: bytes = MINIMAL_PDF) -> dict[str, tuple[str, bytes, str]]:
    return {"pdf": ("statement.pdf", data, "application/pdf")}


def _fake_redact(fmt: Literal["pdf", "xlsx"], data: bytes, *, redactions: int = 3):  # type: ignore[no-untyped-def]
    from bankstract import RedactReport, RedactResult

    def _impl(source: object, *, bank: str | None = None):  # type: ignore[no-untyped-def]
        report = RedactReport(bank="fbn", pages=1, redactions=redactions, audit=[])
        return RedactResult(
            data=data,
            bank="fbn",
            format=fmt,
            format_version="fbn-2026-01",
            report=report,
        )

    return _impl


def test_media_type_helper() -> None:
    from bankstract_cloud.engine import EngineError, media_type_for

    assert media_type_for("pdf") == PDF_MEDIA
    assert media_type_for("xlsx") == XLSX_MEDIA
    with pytest.raises(EngineError):
        media_type_for("docx")


def test_redact_pdf_round_trip(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    redacted = b"%PDF-1.4 redacted body"
    monkeypatch.setattr("bankstract.redact", _fake_redact("pdf", redacted, redactions=5))

    resp = harness.client.post(
        "/v1/parse",
        files=_pdf(),
        data={"redact": "true"},
        headers=_auth(harness.test_key),
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == PDF_MEDIA
    assert resp.headers["x-bankstract-redactions"] == "5"
    assert resp.headers["x-bankstract-format-version"] == "fbn-2026-01"
    assert resp.content == redacted


def test_redact_xlsx_content_type(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    blob = b"PK\x03\x04 fake xlsx"
    monkeypatch.setattr("bankstract.redact", _fake_redact("xlsx", blob))

    resp = harness.client.post(
        "/v1/parse",
        files=_pdf(),
        data={"redact": "true"},
        headers=_auth(harness.test_key),
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == XLSX_MEDIA
    assert resp.content == blob


def test_redact_unsupported_pdf_returns_422(harness: Harness) -> None:
    # No monkeypatch: the real engine has no redactor for a synthetic PDF.
    resp = harness.client.post(
        "/v1/parse",
        files=_pdf(),
        data={"redact": "true"},
        headers=_auth(harness.test_key),
    )
    assert resp.status_code == 422
