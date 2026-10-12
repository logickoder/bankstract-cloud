# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import tempfile
import time
import uuid
from pathlib import Path
from typing import Any

import pytest
from bankstract import ParseResult, RedactReport, RedactResult, ResourceLimitError

from bankstract_cloud import engine
from bankstract_cloud.config import Settings
from tests.conftest import (
    LIMITS,
    Harness,
    audit_rows,
    auth_header,
    empty_parse_result,
    pdf_upload,
)
from tests.fixtures import MINIMAL_PDF

# Every call that touches a customer PDF must run in the engine's killable child. These tests pin
# that, because a regression here is silent: the call still works, it just stops being killable.


def test_parse_statement_asks_the_engine_to_isolate(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    def _parse(source: object, **kwargs: Any) -> ParseResult:
        seen.update(kwargs)
        return empty_parse_result()

    monkeypatch.setattr("bankstract.parse", _parse)
    limits = engine.IsolationLimits(timeout_seconds=12.5, memory_mb=777)
    engine.parse_statement(MINIMAL_PDF, fmt="json", limits=limits)

    assert seen["isolate"] is True
    assert seen["timeout"] == 12.5
    assert seen["memory_mb"] == 777


def test_redact_pdf_asks_the_engine_to_isolate(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    def _redact(source: object, **kwargs: Any) -> RedactResult:
        seen.update(kwargs)
        return RedactResult(
            data=b"%PDF-redacted",
            bank="fbn",
            format="pdf",
            format_version="fbn-2026-01",
            report=RedactReport(bank="fbn", pages=1, redactions=1, audit=[]),
        )

    monkeypatch.setattr("bankstract.redact", _redact)
    limits = engine.IsolationLimits(timeout_seconds=9.0, memory_mb=512)
    engine.redact_pdf(MINIMAL_PDF, limits=limits)

    assert seen["isolate"] is True
    assert seen["timeout"] == 9.0
    assert seen["memory_mb"] == 512


def test_routes_hand_the_engine_the_configured_limits(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: dict[str, Any] = {}

    def _parse(source: object, **kwargs: Any) -> ParseResult:
        seen.update(kwargs)
        return empty_parse_result()

    monkeypatch.setattr("bankstract.parse", _parse)
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )

    assert resp.status_code == 200
    settings = Settings()
    assert seen["isolate"] is True
    assert seen["timeout"] == settings.isolate_timeout_seconds
    assert seen["memory_mb"] == settings.isolate_memory_mb


def test_default_memory_limit_fits_the_box() -> None:
    # parse_max_concurrent children at the memory limit must leave room on the 4GB box for web.
    settings = Settings()
    assert settings.parse_max_concurrent * settings.isolate_memory_mb <= 2048


def test_a_resource_limit_is_a_422_that_never_reads_as_clean(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    def _limit(source: object, **_: Any) -> ParseResult:
        # The engine text can name a script path. It must not reach the client.
        raise ResourceLimitError("worker died: /srv/app/secret_main.py")

    monkeypatch.setattr("bankstract.parse", _limit)
    resp = harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key)
    )

    assert resp.status_code == 422
    body = resp.json()
    assert body["error_class"] == "ResourceLimitError"
    assert body["error"].startswith("Statement exceeded processing limits.")
    assert "secret_main" not in resp.text
    assert set(body) == {"error", "error_class", "format_version", "marker_coverage"}


def test_a_resource_limit_is_audited_as_a_failure(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    def _limit(source: object, **_: Any) -> ParseResult:
        raise ResourceLimitError("timeout")

    monkeypatch.setattr("bankstract.parse", _limit)
    harness.client.post("/v1/parse", files=pdf_upload(), headers=auth_header(harness.test_key))

    row = audit_rows(harness)[-1]
    assert row["success"] == 0
    assert row["error_class"] == "ResourceLimitError"


# Real isolation: no fakes. These start the engine's actual forkserver child.


def test_real_isolated_parse_carries_a_parse_error_across_the_boundary() -> None:
    # MINIMAL_PDF matches no bank. The child raises ParseError, the boundary keeps its class, and
    # the worker maps it the same as an in-process call would.
    with pytest.raises(engine.UnsupportedStatementError) as info:
        engine.parse_statement(MINIMAL_PDF, fmt="json", limits=LIMITS)
    assert info.value.error_class != "ResourceLimitError"


def test_real_isolated_parse_past_the_timeout_is_refused() -> None:
    tiny = engine.IsolationLimits(timeout_seconds=0.001, memory_mb=1024)
    with pytest.raises(engine.UnsupportedStatementError) as info:
        engine.parse_statement(MINIMAL_PDF, fmt="json", limits=tiny)
    assert info.value.error_class == "ResourceLimitError"


def _files_holding(root: Path, needle: bytes, *, since: float) -> list[Path]:
    """Regular files under `root` modified at or after `since` that contain `needle`. Unreadable
    files are skipped: other processes write under the temp dir while this runs."""
    found: list[Path] = []
    for path in root.rglob("*"):
        try:
            if path.is_file() and path.stat().st_mtime >= since and needle in path.read_bytes():
                found.append(path)
        except OSError:
            continue
    return found


def test_real_isolated_parse_writes_no_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Privacy: PDF bytes cross to the child over a pipe, never a temp file. A unique marker rides in
    # the upload and no file under the temp dir or the cwd may contain it. Looking for the bytes,
    # not for "any new file", keeps the test honest on a busy machine where other processes write
    # to the temp dir at the same time.
    monkeypatch.chdir(tmp_path)
    marker = f"%unique-statement-marker-{uuid.uuid4().hex}".encode()
    started = time.time() - 1

    with pytest.raises(engine.UnsupportedStatementError):
        engine.parse_statement(MINIMAL_PDF + marker, fmt="json", limits=LIMITS)

    assert _files_holding(Path(tempfile.gettempdir()), marker, since=started) == []
    assert _files_holding(tmp_path, marker, since=started) == []
    assert list(tmp_path.iterdir()) == []
