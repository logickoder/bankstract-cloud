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

from . import __version__
from .audit import AuditLog
from .auth import KeyStore
from .billing_cron import billing_scheduler
from .config import get_settings
from .db import connect, run_migrations
from .overage_ledger import CycleTierStore, OverageLedger
from .paystack import PaystackClient
from .rate_limit import RateLimiter
from .responses import class_for_status, error_response
from .routes import account, billing, health, keys, parse
from .state import AppState
from .subscriptions import SubscriptionStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bankstract_cloud")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = get_settings()
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
    )
    scheduler = asyncio.create_task(billing_scheduler(app.state.app_state))
    try:
        yield
    finally:
        # Stop the ticker before closing the shared connection it would otherwise use.
        scheduler.cancel()
        with suppress(asyncio.CancelledError):
            await scheduler
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
        {"name": "Billing", "description": "Paystack subscription checkout, status, and webhook."},
        {"name": "Account", "description": "Usage, supported banks, and version."},
        {"name": "Health", "description": "Liveness and readiness probes."},
    ],
    lifespan=lifespan,
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # Every non-2xx shares the ErrorResponse envelope (engine + framework errors alike).
    return error_response(exc.status_code, str(exc.detail), class_for_status(exc.status_code))


for _router in (health.router, account.router, keys.router, billing.router, parse.router):
    app.include_router(_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
