# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.responses import JSONResponse

from ..audit import AuditEntry
from ..auth import AuthContext
from ..engine import (
    EngineError,
    UnsupportedStatementError,
    parse_csv,
    parse_pdf,
    redact_pdf,
)
from ..models import ErrorResponse, ParseResponse
from ..responses import error_response
from ..state import AppState, client_ip, get_state, require_auth
from ..turnstile import verify_turnstile
from ..watermark import DEMO_TIER, watermark_csv, watermark_json

router = APIRouter(tags=["Parse"])


@router.post(
    "/v1/parse",
    response_model=ParseResponse,
    responses={
        401: {"model": ErrorResponse},
        402: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
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
    settings = state.settings

    _enforce_size_header(request, settings.max_upload_bytes)

    if ctx.is_anonymous:
        await _check_anonymous_access(request, state, turnstile_token)

    # Live keys parse only under an active subscription (charter §5). Test keys parse free.
    # Fail before reading the upload so an inactive account never moves PDF bytes.
    if ctx.is_billable and not (ctx.owner and state.subscriptions.is_active(ctx.owner)):
        return error_response(402, "subscription inactive", "subscription_inactive")

    data = await pdf.read()
    byte_count = len(data)
    if byte_count > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="file too large")

    try:
        if redact:
            redacted = redact_pdf(data, bank=bank)
            _record_success(state, ctx, pdf.filename, byte_count, redacted.bank)
            # Stream redacted bytes straight to the response: no disk, no payload log.
            return Response(
                content=redacted.data,
                media_type=redacted.media_type,
                headers={
                    "X-Bankstract-Redactions": str(redacted.redactions),
                    "X-Bankstract-Format-Version": redacted.format_version,
                },
            )
        # Free-demo (anonymous tier) outputs are watermarked; paid/test pass through.
        wm_tier = DEMO_TIER if ctx.is_anonymous else ctx.tier
        if fmt == "csv":
            csv_outcome = parse_csv(data, bank=bank)
            _record_success(state, ctx, pdf.filename, byte_count, csv_outcome.parser_detected)
            return Response(
                content=watermark_csv(csv_outcome.data, tier=wm_tier),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=statement.csv"},
            )
        outcome = parse_pdf(data, bank=bank)
    except UnsupportedStatementError as exc:
        _audit(state, ctx, pdf.filename, byte_count, None, False, exc.error_class)
        # error_class carries the specific engine failure (encrypted / empty / drift /
        # reconcile / parse); marker_coverage rides along for EmptyStatementError.
        return error_response(
            422,
            str(exc),
            exc.error_class,
            format_version=exc.format_version,
            marker_coverage=exc.marker_coverage,
        )
    except EngineError as exc:
        _audit(state, ctx, pdf.filename, byte_count, None, False, exc.error_class)
        return error_response(500, str(exc), exc.error_class, format_version=exc.format_version)
    finally:
        del data  # drop PDF bytes promptly (Directive 1)

    _record_success(state, ctx, pdf.filename, byte_count, outcome.parser_detected)
    if wm_tier == DEMO_TIER:
        enveloped = watermark_json(
            outcome.response.model_dump(mode="json"),
            tier=wm_tier,
            generated_at=datetime.now(UTC).isoformat(),
        )
        return JSONResponse(content=enveloped)
    return outcome.response


async def _check_anonymous_access(
    request: Request,
    state: AppState,
    turnstile_token: str | None,
) -> None:
    # Demo tier: prove human (Turnstile) then spend against the per-IP rate budget.
    # Authenticated keys skip this entirely.
    settings = state.settings
    ok = await verify_turnstile(
        turnstile_token or "",
        secret=settings.turnstile_secret_key,
        remote_ip=client_ip(request),
    )
    if not ok:
        raise HTTPException(status_code=401, detail="Turnstile verification failed")
    allowed = state.rate_limiter.check(
        f"demo:{client_ip(request)}",
        max_count=settings.demo_rate_limit_max,
        window_seconds=settings.demo_rate_limit_window_seconds,
    )
    if not allowed:
        raise HTTPException(status_code=429, detail="rate limit exceeded")


def _record_success(
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
    byte_count: int,
    parser_detected: str | None,
) -> None:
    # Subscription model: a successful parse is audited (and counts toward the cap via the
    # audit success count). No per-parse charge; overage is metered + invoiced separately.
    _audit(state, ctx, filename, byte_count, parser_detected, True, None)


def _enforce_size_header(request: Request, max_bytes: int) -> None:
    raw = request.headers.get("content-length")
    if raw and raw.isdigit() and int(raw) > max_bytes:
        raise HTTPException(status_code=413, detail="file too large")


def _audit(
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
    byte_count: int,
    parser_detected: str | None,
    success: bool,
    error_class: str | None,
) -> None:
    state.audit.record(
        AuditEntry(
            api_key_id=ctx.api_key_id,
            filename=filename,
            byte_count=byte_count,
            parser_detected=parser_detected,
            success=success,
            error_class=error_class,
        )
    )
