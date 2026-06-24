# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import json
import time
from collections.abc import Callable
from types import SimpleNamespace
from typing import Any

import pytest
from bankstract import ProgressCallback, ProgressEvent
from fastapi import HTTPException

from bankstract_cloud.jobs import JobStore
from tests.conftest import Harness, auth_header, pdf_upload


def _success_parse(*events: tuple[str, int, int]) -> Callable[..., SimpleNamespace]:
    def _impl(
        source: object,
        *,
        bank: str | None = None,
        progress_callback: ProgressCallback | None = None,
    ) -> SimpleNamespace:
        if progress_callback is not None:
            for stage, current, total in events:
                progress_callback(ProgressEvent(stage=stage, current=current, total=total))
        return SimpleNamespace(transactions=[], metadata=None)

    return _impl


def _data_events(text: str) -> list[dict[str, Any]]:
    return [
        json.loads(line[len("data: ") :]) for line in text.splitlines() if line.startswith("data: ")
    ]


def _result_event(text: str) -> dict[str, Any]:
    # The final SSE frame: `event: result\ndata: {...}`.
    block = text.split("event: result", 1)[1]
    payload = block.split("data: ", 1)[1].strip()
    return json.loads(payload.splitlines()[0])


# ---- JobStore unit (deterministic, no event loop) ----


def test_jobstore_capability_and_owner_guard() -> None:
    store = JobStore(max_concurrent=2, ttl_seconds=300)
    job = store.create(owner_key="A", filename="f.pdf", byte_count=10)

    assert store.get_or_404(job.id, owner_key=None) is job  # job_id alone is the capability
    assert store.get_or_404(job.id, owner_key="A") is job  # matching owner also passes

    with pytest.raises(HTTPException) as wrong_owner:
        store.get_or_404(job.id, owner_key="B")
    assert wrong_owner.value.status_code == 404  # 404 not 403: never confirm existence

    with pytest.raises(HTTPException) as missing:
        store.get_or_404("nope", owner_key=None)
    assert missing.value.status_code == 404


def test_jobstore_sweep_evicts_and_clears_result() -> None:
    store = JobStore(max_concurrent=2, ttl_seconds=0)
    job = store.create(owner_key="A", filename=None, byte_count=0)
    job.result = "parsed-transactions"
    job.terminal_at = time.monotonic() - 1

    assert store.sweep() == 1
    assert job.result is None  # parsed payload dropped from RAM
    with pytest.raises(HTTPException):
        store.get_or_404(job.id, owner_key=None)


# ---- HTTP ----


def test_submit_returns_202_with_urls(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bankstract.parse", _success_parse(("open", 0, 1)))
    resp = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    assert resp.status_code == 202
    body = resp.json()
    assert body["job_id"]
    assert body["stream_url"] == f"/v1/parse/jobs/{body['job_id']}/stream"
    assert body["poll_url"] == f"/v1/parse/jobs/{body['job_id']}"


def test_stream_emits_progress_then_result(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("bankstract.parse", _success_parse(("open", 0, 1), ("walk_page", 1, 1)))
    sub = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/event-stream")
        text = "".join(resp.iter_text())

    assert any("stage" in event for event in _data_events(text))
    result = _result_event(text)
    assert result["state"] == "done"
    assert result["result"]["transactions"] == []


def test_poll_snapshot_reaches_done(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bankstract.parse", _success_parse(("walk_page", 1, 1)))
    sub = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    # Drain the stream so the job runs to completion deterministically before polling.
    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        "".join(resp.iter_text())

    snap = harness.client.get(sub.json()["poll_url"], headers=auth_header(harness.test_key))
    assert snap.status_code == 200
    body = snap.json()
    assert body["state"] == "done"
    assert body["result"]["transactions"] == []


def test_failed_job_surfaces_error(harness: Harness) -> None:
    # Real engine on the minimal stub finds no parser -> failed job + error envelope (no mock).
    sub = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        text = "".join(resp.iter_text())

    result = _result_event(text)
    assert result["state"] == "failed"
    assert result["error_class"]


def test_poll_requires_auth(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bankstract.parse", _success_parse(("walk_page", 1, 1)))
    sub = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    # The poll endpoint carries auth (fetch can send headers); the stream does not.
    assert harness.client.get(sub.json()["poll_url"]).status_code == 401


def test_demo_jobs_rate_limited(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    # DEMO_RATE_LIMIT_MAX=5 in the harness; submit is the metered point, the stream is not.
    monkeypatch.setattr("bankstract.parse", _success_parse(("walk_page", 1, 1)))
    seen_429 = False
    for _ in range(7):
        resp = harness.client.post(
            "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.demo_key)
        )
        if resp.status_code == 429:
            seen_429 = True
            break
        assert resp.status_code == 202
    assert seen_429


def _redact_mock(
    data: bytes = b"%PDF-redacted", redactions: int = 5
) -> Callable[..., SimpleNamespace]:
    def _impl(
        source: object,
        *,
        bank: str | None = None,
        progress_callback: ProgressCallback | None = None,
    ) -> SimpleNamespace:
        if progress_callback is not None:
            progress_callback(ProgressEvent(stage="redact_page", current=1, total=1))
        return SimpleNamespace(
            data=data,
            bank="fbn",
            format="pdf",
            format_version="fbn-2026-01",
            report=SimpleNamespace(redactions=redactions),
        )

    return _impl


def _csv_mock(payload: bytes = b"date,amount\n2026-01-01,100\n") -> Callable[..., bytes]:
    def _impl(
        source: object,
        *,
        format: str = "csv",
        bank: str | None = None,
        reconcile: bool = True,
        progress_callback: ProgressCallback | None = None,
    ) -> bytes:
        if progress_callback is not None:
            progress_callback(ProgressEvent(stage="walk_page", current=1, total=1))
        return payload

    return _impl


def test_redact_job_streams_url_then_serves_bytes(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("bankstract.redact", _redact_mock())
    sub = harness.client.post(
        "/v1/parse/jobs",
        files=pdf_upload(),
        data={"redact": "true"},
        headers=auth_header(harness.test_key),
    )
    assert sub.status_code == 202

    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        text = "".join(resp.iter_text())
    result = _result_event(text)
    assert result["state"] == "done"
    assert result["kind"] == "redact"
    assert "result" not in result  # bytes are not inlined in the SSE event
    assert result["redactions"] == 5

    got = harness.client.get(result["result_url"], headers=auth_header(harness.test_key))
    assert got.status_code == 200
    assert got.headers["content-type"].startswith("application/pdf")
    assert got.headers["X-Bankstract-Redactions"] == "5"
    assert got.content == b"%PDF-redacted"


def test_csv_job_serves_csv_bytes(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bankstract.parse_to", _csv_mock())
    sub = harness.client.post(
        "/v1/parse/jobs?format=csv", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        text = "".join(resp.iter_text())
    result = _result_event(text)
    assert result["kind"] == "csv"
    assert "result" not in result

    got = harness.client.get(result["result_url"], headers=auth_header(harness.test_key))
    assert got.status_code == 200
    assert got.headers["content-type"].startswith("text/csv")
    assert got.content == b"date,amount\n2026-01-01,100\n"


def test_json_job_result_endpoint_returns_parse_response(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("bankstract.parse", _success_parse(("walk_page", 1, 1)))
    sub = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        "".join(resp.iter_text())

    snap = harness.client.get(sub.json()["poll_url"], headers=auth_header(harness.test_key)).json()
    assert snap["result_kind"] == "json"
    got = harness.client.get(snap["result_url"], headers=auth_header(harness.test_key))
    assert got.status_code == 200
    assert got.json()["transactions"] == []


def test_result_endpoint_404_unknown_and_401_without_auth(harness: Harness) -> None:
    assert (
        harness.client.get(
            "/v1/parse/jobs/nope/result", headers=auth_header(harness.test_key)
        ).status_code
        == 404
    )
    assert harness.client.get("/v1/parse/jobs/nope/result").status_code == 401


def test_failed_job_result_is_404(harness: Harness) -> None:
    # Real engine on the minimal stub fails -> job failed -> no downloadable result.
    sub = harness.client.post(
        "/v1/parse/jobs", files=pdf_upload(), headers=auth_header(harness.test_key)
    )
    with harness.client.stream("GET", sub.json()["stream_url"]) as resp:
        "".join(resp.iter_text())
    got = harness.client.get(
        f"{sub.json()['poll_url']}/result", headers=auth_header(harness.test_key)
    )
    assert got.status_code == 404
