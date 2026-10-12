# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from typing import Literal

import pytest

from tests.conftest import (
    Harness,
    audit_rows,
    auth_header,
    fake_parse,
    owner_test_key,
    pdf_upload,
)

PDF_MEDIA = "application/pdf"
XLSX_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _fake_redact(  # type: ignore[no-untyped-def]
    fmt: Literal["pdf", "xlsx"],
    data: bytes,
    *,
    redactions: int = 3,
    calls: list[int] | None = None,
):
    from bankstract import RedactReport, RedactResult

    def _impl(
        source: object,
        *,
        bank: str | None = None,
        **_isolation: object,
    ):  # type: ignore[no-untyped-def]
        if calls is not None:
            calls.append(1)
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
        "/v1/redact", files=pdf_upload(), headers=auth_header(harness.test_key)
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
        "/v1/redact", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"] == XLSX_MEDIA
    assert resp.content == blob


def test_redact_unsupported_pdf_returns_422(harness: Harness) -> None:
    # No monkeypatch: the real engine has no redactor for a synthetic PDF.
    resp = harness.client.post(
        "/v1/redact", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 422


def test_redact_counts_as_one_parse_and_is_audited_as_redact(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("bankstract.redact", _fake_redact("pdf", b"%PDF-1.4 redacted"))
    harness.client.post("/v1/redact", files=pdf_upload(), headers=auth_header(harness.test_key))

    row = audit_rows(harness)[-1]
    # Metadata only: the route, the bank and success. Never the redaction count or any content.
    assert (row["endpoint"], row["success"], row["parser_detected"]) == ("redact", 1, "fbn")


def test_redact_over_the_free_cap_is_refused_not_sampled(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # TEST_TIER_MONTHLY_CAP is 3 in the harness. There is no canned sample for a redacted
    # document, so over the cap it is a 402 and the engine does not run.
    calls: list[int] = []
    monkeypatch.setattr("bankstract.redact", _fake_redact("pdf", b"%PDF-1.4 redacted", calls=calls))
    key = owner_test_key(harness, "redact_cap")
    for _ in range(3):
        assert (
            harness.client.post(
                "/v1/redact", files=pdf_upload(), headers=auth_header(key)
            ).status_code
            == 200
        )

    over = harness.client.post("/v1/redact", files=pdf_upload(), headers=auth_header(key))
    assert over.status_code == 402
    assert over.json()["error_class"] == "free_limit_reached"
    assert len(calls) == 3
    assert audit_rows(harness)[-1]["endpoint"] == "redact"


@pytest.mark.parametrize("route", ["/v1/parse", "/v1/parse/jobs"])
def test_a_stale_redact_flag_fails_closed(
    harness: Harness, monkeypatch: pytest.MonkeyPatch, route: str
) -> None:
    # The removed field asked for masking. Ignoring it would return the unmasked statement with a
    # 200, so it is refused before admission and the engine: no engine run and no audit row.
    calls: list[int] = []

    def _parse(source: object, **_: object) -> object:
        calls.append(1)
        return fake_parse()(source)

    monkeypatch.setattr("bankstract.parse", _parse)
    resp = harness.client.post(
        route, files=pdf_upload(), data={"redact": "true"}, headers=auth_header(harness.test_key)
    )

    assert resp.status_code == 422
    body = resp.json()
    assert body["error_class"] == "removed_parameter"
    assert "POST /v1/redact" in body["error"]
    assert calls == []
    assert audit_rows(harness) == []


def test_redact_false_is_still_a_plain_parse(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Only the dangerous case is refused: a caller that explicitly asks for no redaction is fine.
    monkeypatch.setattr("bankstract.parse", fake_parse())
    resp = harness.client.post(
        "/v1/parse",
        files=pdf_upload(),
        data={"redact": "false"},
        headers=auth_header(harness.test_key),
    )

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/json")
