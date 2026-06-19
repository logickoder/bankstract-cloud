# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from tests.fixtures import MINIMAL_PDF

DEMO_KEY = "bsk_test_demo_anonymous_key"
MAX_BYTES = 2000


def auth_header(key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {key}"}


def pdf_upload(data: bytes = MINIMAL_PDF) -> dict[str, tuple[str, bytes, str]]:
    return {"pdf": ("statement.pdf", data, "application/pdf")}


@dataclass
class Harness:
    client: TestClient
    test_key: str  # tier="test", not billable
    demo_key: str  # tier="anonymous"


@pytest.fixture
def harness(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Harness]:
    monkeypatch.setenv("AUDIT_DB_PATH", str(tmp_path / "audit.sqlite"))
    monkeypatch.setenv("DEMO_API_KEY", DEMO_KEY)
    monkeypatch.setenv("MAX_UPLOAD_BYTES", str(MAX_BYTES))
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "")  # disabled in tests
    monkeypatch.setenv("STRIPE_SECRET_KEY", "")  # billing no-op in tests
    monkeypatch.setenv("DEMO_RATE_LIMIT_MAX", "5")

    from bankstract_cloud.config import get_settings
    from bankstract_cloud.main import app

    get_settings.cache_clear()

    with TestClient(app) as client:
        issued = app.state.app_state.keystore.issue("test-suite", "test")
        yield Harness(client=client, test_key=issued.raw_key, demo_key=DEMO_KEY)

    get_settings.cache_clear()
