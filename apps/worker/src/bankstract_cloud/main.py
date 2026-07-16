# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.formparsers import MultiPartParser

from . import __version__
from .audit import AuditLog
from .auth import KeyStore
from .billing_cron import billing_scheduler
from .config import get_settings
from .db import connect, run_migrations
from .jobs import JobStore
from .observability import init_sentry
from .overage_ledger import CycleTierStore, OverageLedger
from .paystack import PaystackClient
from .rate_limit import RateLimiter
from .responses import class_for_status, error_response
from .routes import account, billing, health, keys, parse
from .state import AppState
from .subscriptions import SubscriptionStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bankstract_cloud")

# Before the app + ASGI integrations load. No-op without SENTRY_DSN (dev/test).
init_sentry(get_settings())


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
    # Directive 1: PDF bytes never touch disk. Starlette spools each uploaded file part to a
    # SpooledTemporaryFile that ROLLS TO DISK past spool_max_size (default 1MB) during multipart
    # parsing, before the worker ever holds the bytes. Bank PDFs routinely exceed 1MB, so the
    # default writes the statement to a temp file. Raise the ceiling to the upload cap so the whole
    # file stays in memory; anything larger is rejected in _admit_upload before it can matter. Set
    # here (not at import) so it tracks the settings the app actually runs with.
    MultiPartParser.spool_max_size = settings.max_upload_bytes
    run_migrations(settings.audit_db_path)
    conn = connect(settings.audit_db_path)
    app.state.app_state = AppState(
        settings=settings,
        keystore=KeyStore(conn, demo_api_key=settings.demo_api_key),
        audit=AuditLog(conn),
        rate_limiter=RateLimiter(conn),
        paystack=PaystackClient(secret_key=settings.paystack_secret_key),
        subscriptions=SubscriptionStore(conn),
        cycle_tiers=CycleTierStore(conn),
        overage_ledger=OverageLedger(conn),
        jobs=JobStore(
            max_concurrent=settings.parse_max_concurrent,
            ttl_seconds=settings.job_ttl_seconds,
        ),
        conn=conn,
    )
    scheduler = asyncio.create_task(billing_scheduler(app.state.app_state))
    sweeper = asyncio.create_task(_job_sweeper(app.state.app_state))
    retention = asyncio.create_task(_retention_sweeper(app.state.app_state))
    try:
        yield
    finally:
        # Stop the background tasks before closing the shared connection they would otherwise use.
        for task in (scheduler, sweeper, retention):
            task.cancel()
        for task in (scheduler, sweeper, retention):
            with suppress(asyncio.CancelledError):
                await task
        conn.close()


async def _job_sweeper(state: AppState) -> None:
    # Evict terminal parse jobs (and their in-RAM results) once past their TTL.
    while True:
        await asyncio.sleep(state.settings.job_ttl_seconds)
        state.jobs.sweep()


async def _retention_sweeper(state: AppState) -> None:
    # Storage limitation (NDPR, /privacy): purge audit metadata past the retention window.
    # Runs once at boot, then daily. A transient DB error (e.g. "database is locked") must not
    # kill the task permanently, or retention silently stops until the next process restart.
    while True:
        try:
            removed = state.audit.purge_older_than(state.settings.audit_retention_days)
            if removed:
                logger.info("retention: purged %d audit rows", removed)
        except Exception:
            logger.exception("retention purge failed; will retry next cycle")
        await asyncio.sleep(86_400)


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
        {"name": "Billing", "description": "Paystack subscription checkout, status, and webhook."},
        {"name": "Account", "description": "Usage, supported banks, and version."},
        {"name": "Health", "description": "Liveness and readiness probes."},
    ],
    lifespan=lifespan,
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # Every non-2xx shares the ErrorResponse envelope. error_response builds a fresh response, so
    # forward any headers the raiser set (e.g. Retry-After on a 429).
    response = error_response(exc.status_code, str(exc.detail), class_for_status(exc.status_code))
    for key, value in (exc.headers or {}).items():
        response.headers[key] = value
    return response


for _router in (health.router, account.router, keys.router, billing.router, parse.router):
    app.include_router(_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins_list,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
