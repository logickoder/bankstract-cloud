# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio
import json
import time
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Literal

import bankstract
from bankstract import ProgressCallback, ProgressEvent
from fastapi import APIRouter, Depends, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse

from ..auth import AuthContext
from ..engine import (
    EngineError,
    UnsupportedStatementError,
    parse_statement,
    redact_pdf,
)
from ..jobs import TERMINAL_STAGE, Job
from ..models import ErrorResponse, JobAccepted, JobSnapshot, ParseResponse, ProgressSnapshot
from ..sample import sample_csv, sample_json_payload
from ..state import (
    AppState,
    get_state,
    require_auth,
)
from ..watermark import DEMO_TIER, watermark_csv, watermark_json
from .admission import (
    ServeSample,
    admit_upload,
    audit_free_cap,
    audit_request,
    fail_response,
    free_cap_refusal,
)

router = APIRouter(tags=["Parse"])


@router.post(
    "/v1/parse",
    response_model=ParseResponse,
    responses={
        401: {"model": ErrorResponse},
        402: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Parse a bank statement",
    description=(
        "Upload a PDF (or XLSX) statement and get structured transactions back. "
        "`?format=json` (default) returns ParseResponse; `?format=csv` returns the "
        "engine-serialized CSV. `redact=true` returns the redacted document bytes. "
        "The file is parsed in memory and never written to disk."
    ),
)
async def parse(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext = Depends(require_auth),
    bank: str | None = Form(default=None),
    redact: bool = Form(default=False),
    turnstile_token: str | None = Form(default=None),
    fmt: Literal["json", "csv"] = Query(default="json", alias="format"),
    state: AppState = Depends(get_state),
) -> ParseResponse | Response:
    admitted = await admit_upload(request, pdf, ctx, state, turnstile_token)
    if isinstance(admitted, ServeSample):
        return _canned_response(fmt, redact, state, ctx, pdf.filename)
    if isinstance(admitted, JSONResponse):
        return admitted
    data, byte_count = admitted

    try:
        if redact:
            async with state.jobs.semaphore:
                redacted = await asyncio.to_thread(
                    redact_pdf, data, bank=bank, limits=state.isolation
                )
            _record_success(state, ctx, pdf.filename, byte_count, redacted.bank)
            return _redact_response(
                redacted.data,
                media_type=redacted.media_type,
                redactions=redacted.redactions,
                format_version=redacted.format_version,
            )
        # Free-demo (anonymous tier) outputs are watermarked; paid/test pass through.
        wm_tier = DEMO_TIER if ctx.is_anonymous else ctx.tier
        # Off the event loop so a long parse can't stall SSE streams and polls, but under the job
        # semaphore: parse_max_concurrent caps engine threads (and pdfplumber RAM) across the sync
        # and async surfaces together.
        async with state.jobs.semaphore:
            outcome = await asyncio.to_thread(
                parse_statement, data, fmt=fmt, bank=bank, limits=state.isolation
            )
    except (UnsupportedStatementError, EngineError) as exc:
        return fail_response(state, ctx, pdf.filename, byte_count, exc)
    finally:
        # The tuple also holds the bytes, so drop both references (Directive 1).
        del data, admitted

    _record_success(state, ctx, pdf.filename, byte_count, outcome.parser_detected)
    if fmt == "csv":
        return _csv_response(watermark_csv(outcome.data, tier=wm_tier))
    if wm_tier == DEMO_TIER:
        return JSONResponse(content=_demo_json(outcome.data))
    # Engine bytes as-is: the wire shape is the pinned engine's serialize() (see parse_statement).
    return Response(content=outcome.data, media_type="application/json")


@router.post(
    "/v1/parse/jobs",
    status_code=202,
    response_model=JobAccepted,
    responses={
        401: {"model": ErrorResponse},
        402: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
    },
    summary="Submit a long parse as an async job",
    description=(
        "Queue a statement parse and stream engine progress over Server-Sent Events. Returns 202 "
        "with a job_id, an SSE stream_url, and a poll_url fallback. Mirrors /v1/parse: "
        "`?format=csv` and `redact=true` are supported. json rides the SSE result event; csv and "
        "redact bytes are fetched from /v1/parse/jobs/{id}/result. Use this for large statements; "
        "small ones are faster on the synchronous /v1/parse."
    ),
)
async def submit_job(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext = Depends(require_auth),
    bank: str | None = Form(default=None),
    redact: bool = Form(default=False),
    turnstile_token: str | None = Form(default=None),
    fmt: Literal["json", "csv"] = Query(default="json", alias="format"),
    state: AppState = Depends(get_state),
) -> JobAccepted | Response:
    admitted = await admit_upload(request, pdf, ctx, state, turnstile_token)
    if isinstance(admitted, ServeSample):
        # Over a free cap. The demo drives this async path, so preserve the 202 + job contract: a
        # canned sample job is created already done (no engine, no _run_job). redact has no
        # meaningful sample, so it is a hard nudge served inline.
        if redact:
            return _canned_response(fmt, redact, state, ctx, pdf.filename)
        job = state.jobs.create(
            owner_key=ctx.api_key_id,
            filename=pdf.filename,
            byte_count=0,
            is_sample=True,
        )
        job.result_kind = fmt
        job.state = "done"
        job.terminal_at = time.monotonic()
        audit_free_cap(state, ctx, pdf.filename)
        return JobAccepted(
            job_id=job.id,
            stream_url=f"/v1/parse/jobs/{job.id}/stream",
            poll_url=f"/v1/parse/jobs/{job.id}",
        )
    if isinstance(admitted, JSONResponse):
        return admitted
    data, byte_count = admitted

    job = state.jobs.create(
        owner_key=ctx.api_key_id,
        filename=pdf.filename,
        byte_count=byte_count,
        is_anonymous=ctx.is_anonymous,
    )
    # Runs to completion after this 202 returns. _run_job owns the bytes from here and drops them
    # when done (Directive 1). The task is held on the job so the loop never garbage-collects it.
    job.task = asyncio.create_task(_run_job(state, ctx, job, data, bank, redact, fmt))
    return JobAccepted(
        job_id=job.id,
        stream_url=f"/v1/parse/jobs/{job.id}/stream",
        poll_url=f"/v1/parse/jobs/{job.id}",
    )


@router.get(
    "/v1/parse/jobs/{job_id}/stream",
    summary="Stream parse progress (SSE)",
    description=(
        "Server-Sent Events for a job: data lines carry {stage,current,total} progress, then a "
        "final `event: result` carries the ParseResponse (success) or the error envelope. No "
        "Authorization header: the unguessable job_id is the capability, since EventSource cannot "
        "send headers. One consumer per job."
    ),
)
async def stream_job(job_id: str, state: AppState = Depends(get_state)) -> StreamingResponse:
    job = state.jobs.get_or_404(job_id, owner_key=None)
    return StreamingResponse(
        _event_stream(job),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get(
    "/v1/parse/jobs/{job_id}",
    response_model=JobSnapshot,
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Poll a parse job",
    description=(
        "JSON snapshot of a job, the polling fallback to SSE. result appears once state is done; "
        "the error fields once failed."
    ),
)
async def poll_job(
    job_id: str,
    ctx: AuthContext = Depends(require_auth),
    state: AppState = Depends(get_state),
) -> JobSnapshot:
    job = state.jobs.get_or_404(job_id, owner_key=ctx.api_key_id)
    return _snapshot(job)


@router.get(
    "/v1/parse/jobs/{job_id}/result",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
    summary="Download a finished job's result",
    description=(
        "The byte channel for csv/redact jobs (the SSE result event carries JSON only). Returns "
        "the ParseResponse JSON for a json job, or the CSV / redacted bytes for csv / redact. "
        "404 until the job is done, or after its result is swept."
    ),
)
async def job_result(
    job_id: str,
    ctx: AuthContext = Depends(require_auth),
    state: AppState = Depends(get_state),
) -> Response:
    job = state.jobs.get_or_404(job_id, owner_key=ctx.api_key_id)
    if job.state != "done" or (job.result is None and not job.is_sample):
        raise HTTPException(status_code=404, detail="job result not available")
    # Same machine-readable sample marker as the sync path: a proxy that gates on the header
    # (never rendering synthetic rows as the user's statement) must work on both surfaces.
    sample_headers = {"X-Bankstract-Sample": "true"} if job.is_sample else None
    if job.result_kind == "json":
        if job.result is not None and not job.is_anonymous:
            # Nothing to add (no _demo, no _sample): serve the engine bytes without a decode.
            return Response(content=job.result.data, media_type="application/json")
        return JSONResponse(content=_json_payload(job), headers=sample_headers)
    if job.result_kind == "csv":
        response = _csv_response(_csv_payload(job))
        if job.is_sample:
            response.headers["X-Bankstract-Sample"] = "true"
        return response
    assert job.result is not None  # redact is never an is_sample job (json/csv only)
    return _redact_response(
        job.result.data,
        media_type=job.media_type or "application/octet-stream",
        redactions=job.redactions or 0,
        format_version=job.format_version or "",
    )


async def _run_job(
    state: AppState,
    ctx: AuthContext,
    job: Job,
    data: bytes,
    bank: str | None,
    redact: bool,
    fmt: Literal["json", "csv"],
) -> None:
    loop = asyncio.get_running_loop()
    # Throttle the stream so the browser sees start + end of each phase, not every page event.
    callback = bankstract.throttle(
        _progress_relay(job, loop), min_interval_ms=state.settings.sse_throttle_ms
    )
    try:
        async with state.jobs.semaphore:
            job.state = "running"
            # Same branch order as the sync /v1/parse. The result is stored raw; anonymous (demo)
            # json/csv is watermarked at serve time (_json_payload / _csv_payload) so the demo
            # cannot get clean output through the async surface.
            if redact:
                redacted = await asyncio.to_thread(
                    redact_pdf,
                    data,
                    bank=bank,
                    limits=state.isolation,
                    progress_callback=callback,
                )
                job.result = redacted
                job.result_kind = "redact"
                job.media_type = redacted.media_type
                job.format_version = redacted.format_version
                job.redactions = redacted.redactions
                parser_detected = redacted.bank
            else:
                parsed = await asyncio.to_thread(
                    parse_statement,
                    data,
                    fmt=fmt,
                    bank=bank,
                    limits=state.isolation,
                    progress_callback=callback,
                )
                job.result = parsed
                job.result_kind = fmt
                parser_detected = parsed.parser_detected
        job.state = "done"
        _record_success(state, ctx, job.filename, job.byte_count, parser_detected)
    except UnsupportedStatementError as exc:
        _fail_job(job, exc.error_class, str(exc), exc.format_version, exc.marker_coverage)
        audit_request(state, ctx, job.filename, job.byte_count, exc.bank, False, exc.error_class)
    except EngineError as exc:
        _fail_job(job, exc.error_class, str(exc), exc.format_version, None)
        audit_request(state, ctx, job.filename, job.byte_count, exc.bank, False, exc.error_class)
    except Exception as exc:  # never leave a job stuck "running"
        _fail_job(job, type(exc).__name__, str(exc), None, None)
        audit_request(state, ctx, job.filename, job.byte_count, None, False, type(exc).__name__)
    finally:
        del data  # drop PDF bytes promptly (Directive 1)
        job.terminal_at = time.monotonic()
        await job.queue.put({"stage": TERMINAL_STAGE, "state": job.state})


def _progress_relay(job: Job, loop: asyncio.AbstractEventLoop) -> ProgressCallback:
    # Engine fires events from the worker thread; marshal each onto the job queue on the event loop.
    # last_event is the replay value a late SSE subscriber receives first.
    def relay(event: ProgressEvent) -> None:
        payload = {"stage": event.stage, "current": event.current, "total": event.total}
        job.last_event = payload
        loop.call_soon_threadsafe(job.queue.put_nowait, payload)

    return relay


def _fail_job(
    job: Job,
    error_class: str,
    message: str,
    format_version: str | None,
    marker_coverage: float | None,
) -> None:
    job.state = "failed"
    job.error_class = error_class
    job.error_message = message
    job.format_version = format_version
    job.marker_coverage = marker_coverage


async def _event_stream(job: Job) -> AsyncIterator[str]:
    # Replay the latest progress so a late subscriber sees current state, then drain until terminal.
    if job.last_event is not None:
        yield _sse(job.last_event)
    while job.state in ("queued", "running"):
        event = await job.queue.get()
        if event.get("stage") == TERMINAL_STAGE:
            break
        yield _sse(event)
    yield _sse_result(job)


def _sse(data: dict[str, object]) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _result_url(job: Job) -> str:
    return f"/v1/parse/jobs/{job.id}/result"


def _json_payload(job: Job) -> dict[str, object]:
    # Over a free cap: canned sample, engine never ran (job.result is None).
    if job.is_sample:
        return sample_json_payload()
    # Anonymous (demo) json is watermarked, matching the sync /v1/parse path. Applied at serve
    # time so the demo cannot get clean output via the async job surface.
    if job.is_anonymous:
        return _demo_json(job.result.data)
    return json.loads(job.result.data)


def _demo_json(data: bytes) -> dict[str, object]:
    # The one place demo JSON gets its _demo envelope, for the sync and async surfaces alike.
    return watermark_json(
        json.loads(data), tier=DEMO_TIER, generated_at=datetime.now(UTC).isoformat()
    )


def _csv_payload(job: Job) -> bytes:
    if job.is_sample:
        return sample_csv()
    data: bytes = job.result.data
    return watermark_csv(data, tier=DEMO_TIER) if job.is_anonymous else data


def _sse_result(job: Job) -> str:
    final: dict[str, object] = {"state": job.state, "error_class": job.error_class}
    if job.error_message is not None:
        final["error"] = job.error_message
    if job.state == "done" and (job.result is not None or job.is_sample):
        final["kind"] = job.result_kind
        # Sample marker on the event itself: the json payload carries _sample, but csv consumers
        # only see result_url, so without this flag they cannot tell before fetching.
        if job.is_sample:
            final["sample"] = True
        if job.result_kind == "json":
            # json rides the event; csv/redact bytes are fetched from result_url.
            final["result"] = _json_payload(job)
        else:
            final["result_url"] = _result_url(job)
            if job.format_version is not None:
                final["format_version"] = job.format_version
            if job.result_kind == "redact" and job.redactions is not None:
                final["redactions"] = job.redactions
    return f"event: result\ndata: {json.dumps(final)}\n\n"


def _snapshot(job: Job) -> JobSnapshot:
    last = job.last_event
    progress = (
        ProgressSnapshot(stage=last["stage"], current=last["current"], total=last["total"])
        if last is not None
        else None
    )
    # is_sample jobs are "done" with no engine result; they still serve via result_url.
    is_done = job.state == "done" and (job.result is not None or job.is_sample)
    return JobSnapshot(
        job_id=job.id,
        state=job.state,
        result_kind=job.result_kind,
        progress=progress,
        result=(
            ParseResponse.model_validate_json(job.result.data)
            # Anonymous json is served watermarked via result_url (the byte channel), never inlined
            # raw here. Authenticated callers get the typed response directly.
            if (
                job.state == "done"
                and job.result is not None
                and job.result_kind == "json"
                and not job.is_anonymous
            )
            else None
        ),
        result_url=_result_url(job) if is_done else None,
        format_version=job.format_version if (is_done and job.result_kind == "redact") else None,
        redactions=job.redactions if (is_done and job.result_kind == "redact") else None,
        sample=job.is_sample,
        error=job.error_message,
        error_class=job.error_class,
    )


def _canned_response(
    fmt: Literal["json", "csv"],
    redact: bool,
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
) -> Response:
    # Over a free cap: return the canned sample instead of running the engine. redact has none.
    if redact:
        return free_cap_refusal(state, ctx, filename)
    audit_free_cap(state, ctx, filename)
    if fmt == "csv":
        response = _csv_response(sample_csv())
    else:
        response = JSONResponse(content=sample_json_payload())
    response.headers["X-Bankstract-Sample"] = "true"
    return response


def _record_success(
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
    byte_count: int,
    parser_detected: str | None,
) -> None:
    # Subscription model: a successful parse is audited (and counts toward the cap via the
    # audit success count). No per-parse charge; overage is metered + invoiced separately.
    audit_request(state, ctx, filename, byte_count, parser_detected, True, None)


def _csv_response(content: bytes) -> Response:
    # Shared CSV wire response (sync /v1/parse?format=csv + the job /result download).
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=statement.csv"},
    )


def _redact_response(
    content: bytes, *, media_type: str, redactions: int, format_version: str
) -> Response:
    # Shared redacted-document wire response (sync redact + the job /result download). Bytes stream
    # straight out: no disk, no payload log.
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "X-Bankstract-Redactions": str(redactions),
            "X-Bankstract-Format-Version": format_version,
        },
    )
