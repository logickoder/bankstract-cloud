# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import pytest
from bankstract import ProgressEvent

from bankstract_cloud import engine
from tests.conftest import empty_parse_result, fake_parse
from tests.fixtures import MINIMAL_PDF


def test_parse_statement_threads_progress_callback(monkeypatch: pytest.MonkeyPatch) -> None:
    # The wrapper must hand our callback to the engine and let every ProgressEvent reach it.
    events: list[ProgressEvent] = []

    pages = [("extract_page", i, 3) for i in range(1, 4)]
    monkeypatch.setattr("bankstract.parse", fake_parse(*pages))

    engine.parse_statement(MINIMAL_PDF, fmt="json", progress_callback=events.append)

    # The real reconcile_result runs after the fake parse. Its events must reach the same callback
    # (engine 0.16.1; 0.16.0 dropped them because parse()'s progress scope had already closed).
    parse_events = [e for e in events if e.stage == "extract_page"]
    assert [e.current for e in parse_events] == [1, 2, 3]
    stages = [e.stage for e in events]
    assert "reconcile" in stages
    assert stages.index("reconcile") > stages.index("extract_page")


def test_parse_statement_without_callback_is_unaffected(monkeypatch: pytest.MonkeyPatch) -> None:
    # The sync path passes no callback; the engine sees None and behaves as before.
    seen: dict[str, object] = {}

    def fake_parse(source: object, *, bank: str | None = None, progress_callback=None):  # type: ignore[no-untyped-def]
        seen["progress_callback"] = progress_callback
        return empty_parse_result()

    monkeypatch.setattr("bankstract.parse", fake_parse)

    engine.parse_statement(MINIMAL_PDF, fmt="json")

    assert seen["progress_callback"] is None
