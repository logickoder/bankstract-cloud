# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from tests.fixtures import MINIMAL_PDF

# The engine's own committed encrypted fixture, fetched at test time (never vendored,
# no bank PDFs in this repo). Mirrors how the demo consumes engine sample fixtures.
_ENCRYPTED_PDF_URL = "https://raw.githubusercontent.com/logickoder/bankstract/main/tests/fixtures/encrypted_sample.pdf"


@pytest.fixture(scope="session")
def encrypted_pdf(request: pytest.FixtureRequest) -> bytes:
    # Cache to the gitignored .pytest_cache dir: download once, reuse across runs.
    cache_path = request.config.cache.mkdir("bankstract_fixtures") / "encrypted_sample.pdf"
    if cache_path.exists():
        return cache_path.read_bytes()
    try:
        resp = httpx.get(_ENCRYPTED_PDF_URL, timeout=15.0, follow_redirects=True)
        resp.raise_for_status()
    except Exception as exc:  # network-gated integration fixture
        pytest.skip(f"encrypted fixture unavailable (offline?): {exc}")
    cache_path.write_bytes(resp.content)
    return resp.content


DEMO_KEY = "bsk_test_demo_anonymous_key"
ADMIN_TOKEN = "admin-secret-token"
PAYSTACK_SECRET = "sk_test_paystack_dummy"  # signs webhook fixtures; never a real key
PAYSTACK_PLAN_STARTER = "PLN_starter_test"
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
    admin_token: str  # gates /v1/keys
    paystack_secret: str  # signs webhook fixtures (HMAC-SHA512)


def _make_harness(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, *, admin_token: str
) -> Iterator[Harness]:
    monkeypatch.setenv("AUDIT_DB_PATH", str(tmp_path / "audit.sqlite"))
    monkeypatch.setenv("DEMO_API_KEY", DEMO_KEY)
    monkeypatch.setenv("ADMIN_API_TOKEN", admin_token)
    monkeypatch.setenv("MAX_UPLOAD_BYTES", str(MAX_BYTES))
    monkeypatch.setenv("TURNSTILE_SECRET_KEY", "")  # disabled in tests
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", PAYSTACK_SECRET)
    monkeypatch.setenv("PAYSTACK_PLAN_STARTER", PAYSTACK_PLAN_STARTER)
    monkeypatch.setenv("DEMO_RATE_LIMIT_MAX", "5")

    from bankstract_cloud.config import get_settings
    from bankstract_cloud.main import app

    get_settings.cache_clear()

    with TestClient(app) as client:
        issued = app.state.app_state.keystore.issue("test-suite", "test")
        yield Harness(
            client=client,
            test_key=issued.raw_key,
            demo_key=DEMO_KEY,
            admin_token=admin_token,
            paystack_secret=PAYSTACK_SECRET,
        )

    get_settings.cache_clear()


@pytest.fixture
def harness(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Harness]:
    yield from _make_harness(tmp_path, monkeypatch, admin_token=ADMIN_TOKEN)


@pytest.fixture
def harness_no_admin(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Harness]:
    # Admin token unset → key management is disabled (the empty-token footgun guard).
    yield from _make_harness(tmp_path, monkeypatch, admin_token="")
