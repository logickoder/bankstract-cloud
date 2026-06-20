# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hmac
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import (
    Depends,
    FastAPI,
    Form,
    Header,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

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
    parse_csv,
    parse_pdf,
    redact_pdf,
)
from .models import (
    BankInfo,
    BanksResponse,
    ErrorResponse,
    HealthResponse,
    KeyCreatedResponse,
    KeyCreateRequest,
    KeyInfo,
    KeyListResponse,
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


app = FastAPI(
    title="bankstract-cloud API",
    version=__version__,
    description=(
        "Statement parsing API for Nigerian banks. Parse a PDF/XLSX statement into "
        "structured transactions over a single HTTP call. API consumers interact over "
        "HTTP and do not inherit the AGPL-3.0 license of the hosted service."
    ),
    license_info={"name": "AGPL-3.0-only", "url": "https://www.gnu.org/licenses/agpl-3.0.html"},
    openapi_tags=[
        {"name": "Parse", "description": "Turn a statement into structured data."},
        {"name": "Keys", "description": "Issue, list, and revoke API keys (admin-only)."},
        {"name": "Account", "description": "Usage, supported banks, and version."},
        {"name": "Health", "description": "Liveness and readiness probes."},
    ],
    lifespan=lifespan,
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return _error_response(exc.status_code, str(exc.detail), _class_for_status(exc.status_code))


def _state(request: Request) -> AppState:
    state = getattr(request.app.state, "app_state", None)
    if state is None:  # pragma: no cover - only if accessed outside lifespan
        raise HTTPException(status_code=503, detail="worker not ready")
    return state


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip()


def require_auth(
    request: Request,
    authorization: str | None = Header(default=None),
) -> AuthContext:
    raw_key = _bearer_token(authorization)
    if raw_key is None:
        raise HTTPException(status_code=401, detail="missing or malformed API key")
    ctx = _state(request).keystore.authenticate(raw_key)
    if ctx is None:
        raise HTTPException(status_code=401, detail="invalid API key")
    return ctx


def require_admin(request: Request, authorization: str | None = Header(default=None)) -> None:
    # Gates key management. An empty configured token means the feature is OFF — we must
    # never let "" match "" (that would let anyone mint keys). Constant-time compare
    # avoids leaking the token via response timing.
    token = _state(request).settings.admin_api_token
    if not token:
        raise HTTPException(status_code=403, detail="key management is disabled")
    presented = _bearer_token(authorization)
    if presented is None:
        raise HTTPException(status_code=401, detail="missing admin token")
    if not hmac.compare_digest(presented, token):
        raise HTTPException(status_code=401, detail="invalid admin token")


def _client_ip(request: Request) -> str:
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@app.get("/healthz", response_model=HealthResponse, tags=["Health"], summary="Liveness probe")
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/readyz", response_model=ReadyResponse, tags=["Health"], summary="Readiness probe")
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


@app.get(
    "/v1/status",
    response_model=StatusResponse,
    tags=["Account"],
    summary="Worker and engine version",
)
async def status() -> StatusResponse:
    return StatusResponse(status="ok", worker_version=__version__, engine_version=ENGINE_VERSION)


@app.get(
    "/v1/banks",
    response_model=BanksResponse,
    tags=["Account"],
    summary="List supported banks",
)
async def banks(_: AuthContext = Depends(require_auth)) -> BanksResponse:
    return BanksResponse(
        banks=[BankInfo(id=b) for b in list_supported_banks()],
        engine_version=ENGINE_VERSION,
    )


@app.get(
    "/v1/usage",
    response_model=UsageResponse,
    tags=["Account"],
    summary="Current billing-period usage",
)
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


# Key management — admin-only. The `bsk_` keys these mint can't reach here (require_admin,
# not require_auth): a key can never mint more keys. Errors use the shared envelope.
_ADMIN_ERRORS: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse},
    403: {"model": ErrorResponse},
}


@app.post(
    "/v1/keys",
    response_model=KeyCreatedResponse,
    status_code=201,
    responses=_ADMIN_ERRORS,
    tags=["Keys"],
    summary="Issue an API key",
    description="Admin-only. Returns the raw key exactly once; only its argon2 hash is stored.",
)
async def create_key(
    request: Request, body: KeyCreateRequest, _: None = Depends(require_admin)
) -> KeyCreatedResponse:
    issued = _state(request).keystore.issue(body.name, body.env, owner=body.owner)
    # The raw key is returned here and NOWHERE else — the DB only has its argon2 hash.
    return KeyCreatedResponse(
        id=issued.id,
        key=issued.raw_key,
        prefix=issued.lookup_prefix,
        name=body.name,
        env=body.env,
        tier=issued.tier,
    )


@app.get(
    "/v1/keys",
    response_model=KeyListResponse,
    responses=_ADMIN_ERRORS,
    tags=["Keys"],
    summary="List API keys",
)
async def list_keys(
    request: Request,
    owner: str | None = Query(default=None),
    _: None = Depends(require_admin),
) -> KeyListResponse:
    records = _state(request).keystore.list_keys(owner=owner)
    return KeyListResponse(
        keys=[
            KeyInfo(
                id=r.id,
                name=r.name,
                prefix=r.lookup_prefix,
                env=r.env,
                tier=r.tier,
                owner=r.owner,
                created_at=r.created_at,
                revoked_at=r.revoked_at,
            )
            for r in records
        ]
    )


@app.delete(
    "/v1/keys/{key_id}",
    status_code=204,
    responses=_ADMIN_ERRORS,
    tags=["Keys"],
    summary="Revoke an API key",
)
async def revoke_key(request: Request, key_id: str, _: None = Depends(require_admin)) -> Response:
    if not _state(request).keystore.revoke(key_id):
        raise HTTPException(status_code=404, detail="key not found or already revoked")
    return Response(status_code=204)


@app.post(
    "/v1/parse",
    response_model=ParseResponse,
    responses={
        401: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    tags=["Parse"],
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
            _record_success(state, ctx, pdf.filename, byte_count, redacted.bank)
            # Stream redacted bytes straight to the response — no disk, no payload log.
            return Response(
                content=redacted.data,
                media_type=redacted.media_type,
                headers={
                    "X-Bankstract-Redactions": str(redacted.redactions),
                    "X-Bankstract-Format-Version": redacted.format_version,
                },
            )
        if fmt == "csv":
            csv_outcome = parse_csv(data, bank=bank)
            _record_success(state, ctx, pdf.filename, byte_count, csv_outcome.parser_detected)
            return Response(
                content=csv_outcome.data,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=statement.csv"},
            )
        outcome = parse_pdf(data, bank=bank)
    except UnsupportedStatementError as exc:
        _audit(state, ctx, pdf.filename, byte_count, None, False, exc.error_class)
        # error_class carries the specific engine failure (encrypted / empty / drift /
        # reconcile / parse); marker_coverage rides along for EmptyStatementError.
        return _error_response(
            422,
            str(exc),
            exc.error_class,
            format_version=exc.format_version,
            marker_coverage=exc.marker_coverage,
        )
    except EngineError as exc:
        _audit(state, ctx, pdf.filename, byte_count, None, False, exc.error_class)
        return _error_response(500, str(exc), exc.error_class, format_version=exc.format_version)
    finally:
        del data  # drop PDF bytes promptly (Directive 1)

    _record_success(state, ctx, pdf.filename, byte_count, outcome.parser_detected)
    return outcome.response


def _record_success(
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
    byte_count: int,
    parser_detected: str | None,
) -> None:
    _audit(state, ctx, filename, byte_count, parser_detected, True, None)
    _maybe_bill(state, ctx)


def _error_response(
    status: int,
    message: str,
    error_class: str,
    *,
    format_version: str | None = None,
    marker_coverage: float | None = None,
) -> JSONResponse:
    body = ErrorResponse(
        error=message,
        error_class=error_class,
        format_version=format_version,
        marker_coverage=marker_coverage,
    )
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))


# Framework errors (auth, size, rate limit) are raised as HTTPException. This handler
# unifies them into the same ErrorResponse envelope as engine errors, so every non-2xx
# response shares one shape.
_STATUS_CLASS_MAP = {
    401: "AuthError",
    403: "PermissionError",
    413: "PayloadTooLarge",
    415: "UnsupportedMediaType",
    429: "RateLimitError",
    503: "ServiceUnavailable",
}


def _class_for_status(status: int) -> str:
    return _STATUS_CLASS_MAP.get(status, "WorkerError")


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
