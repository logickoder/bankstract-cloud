# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from types import SimpleNamespace

import pytest
from bankstract import ProgressEvent

from bankstract_cloud import engine

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
        return SimpleNamespace(transactions=[], metadata=None)

    monkeypatch.setattr("bankstract.parse", fake_parse)
    monkeypatch.setattr("bankstract.detect", _no_detect)

    engine.parse_pdf(_MINIMAL_PDF, progress_callback=events.append)

    assert [e.current for e in events] == [1, 2, 3]
    assert {e.stage for e in events} == {"extract_page"}


def test_parse_pdf_without_callback_is_unaffected(monkeypatch: pytest.MonkeyPatch) -> None:
    # The sync path passes no callback; the engine sees None and behaves as before.
    seen: dict[str, object] = {}

    def fake_parse(source: object, *, bank: str | None = None, progress_callback=None):  # type: ignore[no-untyped-def]
        seen["progress_callback"] = progress_callback
        return SimpleNamespace(transactions=[], metadata=None)

    monkeypatch.setattr("bankstract.parse", fake_parse)
    monkeypatch.setattr("bankstract.detect", _no_detect)

    engine.parse_pdf(_MINIMAL_PDF)

    assert seen["progress_callback"] is None
