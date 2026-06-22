# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from typing import TYPE_CHECKING, cast

import pytest
import sentry_sdk

from bankstract_cloud.config import Settings
from bankstract_cloud.observability import init_sentry, scrub_event

if TYPE_CHECKING:
    from sentry_sdk.types import Event, Hint


def test_init_sentry_noop_without_dsn(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[dict[str, object]] = []

    def fake_init(**kwargs: object) -> None:
        calls.append(kwargs)

    monkeypatch.setattr(sentry_sdk, "init", fake_init)
    init_sentry(Settings(sentry_dsn=""))
    # No DSN => no network, no reports (Directive 6: no-op when unconfigured).
    assert calls == []


def test_init_sentry_locks_privacy_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    def fake_init(**kwargs: object) -> None:
        captured.update(kwargs)

    monkeypatch.setattr(sentry_sdk, "init", fake_init)
    init_sentry(Settings(sentry_dsn="https://k@o0.ingest.sentry.io/1", env="production"))

    # Directive 1: these four are the privacy invariant. If any flips, PDF bytes / the API key /
    # the upload body can reach Sentry. This test exists to fail when that happens.
    assert captured["include_local_variables"] is False
    assert captured["send_default_pii"] is False
    assert captured["max_request_body_size"] == "never"
    assert captured["traces_sample_rate"] == 0.0


def test_scrub_event_strips_body_and_secrets() -> None:
    event = {
        "request": {
            "data": b"%PDF-1.4 secret bytes",
            "headers": {"Authorization": "Bearer token"},
            "cookies": {"s": "1"},
            "query_string": "redact=true",
        }
    }
    out = scrub_event(cast("Event", event), cast("Hint", {}))
    assert out is not None
    request = out.get("request")
    assert isinstance(request, dict)
    for leaked in ("data", "headers", "cookies", "query_string"):
        assert leaked not in request
