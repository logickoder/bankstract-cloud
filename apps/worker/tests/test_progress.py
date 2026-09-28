# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import pytest
from bankstract import ProgressEvent

from bankstract_cloud import engine
from tests.conftest import empty_parse_result

_MINIMAL_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def _no_detect(source: object) -> None:
    return None


def test_parse_pdf_threads_progress_callback(monkeypatch: pytest.MonkeyPatch) -> None:
    # The wrapper must hand our callback to the engine and let every ProgressEvent reach it.
    events: list[ProgressEvent] = []

    def fake_parse(source: object, *, bank: str | None = None, progress_callback=None):  # type: ignore[no-untyped-def]
        assert progress_callback is not None
        for i in range(1, 4):
            progress_callback(ProgressEvent(stage="extract_page", current=i, total=3))
        return empty_parse_result()

    monkeypatch.setattr("bankstract.parse", fake_parse)
    monkeypatch.setattr("bankstract.detect", _no_detect)

    engine.parse_pdf(_MINIMAL_PDF, progress_callback=events.append)

    # The real reconcile_result runs after the fake parse. Its events must reach the same callback
    # (engine 0.16.1; 0.16.0 dropped them because parse()'s progress scope had already closed).
    parse_events = [e for e in events if e.stage == "extract_page"]
    assert [e.current for e in parse_events] == [1, 2, 3]
    stages = [e.stage for e in events]
    assert "reconcile" in stages
    assert stages.index("reconcile") > stages.index("extract_page")


def test_parse_pdf_without_callback_is_unaffected(monkeypatch: pytest.MonkeyPatch) -> None:
    # The sync path passes no callback; the engine sees None and behaves as before.
    seen: dict[str, object] = {}

    def fake_parse(source: object, *, bank: str | None = None, progress_callback=None):  # type: ignore[no-untyped-def]
        seen["progress_callback"] = progress_callback
        return empty_parse_result()

    monkeypatch.setattr("bankstract.parse", fake_parse)
    monkeypatch.setattr("bankstract.detect", _no_detect)

    engine.parse_pdf(_MINIMAL_PDF)

    assert seen["progress_callback"] is None
