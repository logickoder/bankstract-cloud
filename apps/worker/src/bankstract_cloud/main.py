# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, Form, Header, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .audit import AuditEntry, AuditLog
from .auth import AuthContext, KeyStore
from .billing import BillingClient, BillingError
from .config import Settings, get_settings
from .db import connect, init_schema
from .engine import (
    ENGINE_VERSION,
    EngineError,
    UnsupportedStatementError,
    list_supported_banks,
    parse_pdf,
    redact_pdf,
)
from .models import (
    BankInfo,
    BanksResponse,
    HealthResponse,
    ParseResponse,
    ReadyResponse,
    StatusResponse,
    UsageResponse,
)
from .rate_limit import RateLimiter
from .turnstile import verify_turnstile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bankstract_cloud")


@dataclass
class AppState:
    settings: Settings
    keystore: KeyStore
    audit: AuditLog
    rate_limiter: RateLimiter
    billing: BillingClient


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    conn = connect(settings.audit_db_path)
    init_schema(conn)
    app.state.app_state = AppState(
        settings=settings,
        keystore=KeyStore(conn, demo_api_key=settings.demo_api_key),
        audit=AuditLog(conn),
        rate_limiter=RateLimiter(conn),
        billing=BillingClient(
            secret_key=settings.stripe_secret_key,
            meter_event_name=settings.stripe_meter_event_name,
        ),
    )
    try:
        yield
    finally:
        conn.close()


app = FastAPI(title="bankstract-cloud worker", version=__version__, lifespan=lifespan)


def _state(request: Request) -> AppState:
    state = getattr(request.app.state, "app_state", None)
    if state is None:  # pragma: no cover - only if accessed outside lifespan
        raise HTTPException(status_code=503, detail="worker not ready")
    return state


def require_auth(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthContext:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing or malformed API key")
    raw_key = authorization.removeprefix("Bearer ").strip()
    ctx = _state(request).keystore.authenticate(raw_key)
    if ctx is None:
        raise HTTPException(status_code=401, detail="invalid API key")
    return ctx


def _client_ip(request: Request) -> str:
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@app.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/readyz", response_model=ReadyResponse)
async def readyz(request: Request) -> ReadyResponse:
    state = _state(request)
    db_ok = True
    try:
        state.audit.count_success_for_key("__probe__", since_iso="1970-01-01T00:00:00+00:00")
    except Exception:
        db_ok = False
    engine_ok = bool(list_supported_banks())
    healthy = db_ok and engine_ok
    return ReadyResponse(status="ok" if healthy else "degraded", engine=engine_ok, database=db_ok)


@app.get("/v1/status", response_model=StatusResponse)
async def status() -> StatusResponse:
    return StatusResponse(status="ok", worker_version=__version__, engine_version=ENGINE_VERSION)


@app.get("/v1/banks", response_model=BanksResponse)
async def banks(_: AuthContext = Depends(require_auth)) -> BanksResponse:
    return BanksResponse(
        banks=[BankInfo(id=b) for b in list_supported_banks()],
        engine_version=ENGINE_VERSION,
    )


@app.get("/v1/usage", response_model=UsageResponse)
async def usage(request: Request, ctx: AuthContext = Depends(require_auth)) -> UsageResponse:
    state = _state(request)
    now = datetime.now(UTC)
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    parses = state.audit.count_success_for_key(ctx.api_key_id, since_iso=period_start.isoformat())
    projected = parses * float(state.billing.price_per_parse_usd())
    return UsageResponse(
        api_key_id=ctx.api_key_id,
        period_parses=parses,
        projected_invoice_usd=format(projected, ".2f"),
    )


@app.post("/v1/parse", response_model=ParseResponse)
async def parse(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext = Depends(require_auth),
    bank: str | None = Form(default=None),
    redact: bool = Form(default=False),
    turnstile_token: str | None = Form(default=None),
) -> ParseResponse | Response:
    state = _state(request)
    settings = state.settings

    _enforce_size_header(request, settings.max_upload_bytes)

    if ctx.tier == "anonymous":
        ok = await verify_turnstile(
            turnstile_token or "",
            secret=settings.turnstile_secret_key,
            remote_ip=_client_ip(request),
        )
        if not ok:
            raise HTTPException(status_code=401, detail="Turnstile verification failed")
        allowed = state.rate_limiter.check(
            f"demo:{_client_ip(request)}",
            max_count=settings.demo_rate_limit_max,
            window_seconds=settings.demo_rate_limit_window_seconds,
        )
        if not allowed:
            raise HTTPException(status_code=429, detail="rate limit exceeded")

    data = await pdf.read()
    byte_count = len(data)
    if byte_count > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="file too large")

    try:
        if redact:
            redacted = redact_pdf(data, bank=bank)
            _audit(state, ctx, pdf.filename, byte_count, redacted.bank, True, None)
            _maybe_bill(state, ctx)
            # Stream redacted bytes straight to the response — no disk, no payload log.
            return Response(
                content=redacted.data,
                media_type=redacted.media_type,
                headers={
                    "X-Bankstract-Redactions": str(redacted.redactions),
                    "X-Bankstract-Format-Version": redacted.format_version,
                },
            )
        outcome = parse_pdf(data, bank=bank)
    except UnsupportedStatementError as exc:
        _audit(state, ctx, pdf.filename, byte_count, None, False, exc.error_class)
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except EngineError as exc:
        _audit(state, ctx, pdf.filename, byte_count, None, False, exc.error_class)
        raise HTTPException(
            status_code=500,
            detail={"error": str(exc), "format_version": None},
        ) from exc
    finally:
        del data  # drop PDF bytes promptly (Directive 1)

    _audit(state, ctx, pdf.filename, byte_count, outcome.parser_detected, True, None)
    _maybe_bill(state, ctx)
    return outcome.response


def _maybe_bill(state: AppState, ctx: AuthContext) -> None:
    if not ctx.is_billable:
        return
    try:
        state.billing.record_parse(ctx.api_key_id)
    except BillingError as exc:
        # Don't fail a successful operation on a billing-emit hiccup; metered
        # reconciliation happens at invoice time. Hard delinquency 402 is enforced
        # at auth in apps/app (Layer 4).
        logger.warning("billing emit failed for key %s: %s", ctx.api_key_id, exc)


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


def _install_cors() -> None:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().allowed_origins_list,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )


_install_cors()
