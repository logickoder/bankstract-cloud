# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from .. import __version__
from ..audit import current_period_start_iso
from ..auth import AuthContext
from ..engine import ENGINE_VERSION, list_supported_banks
from ..models import (
    BankInfo,
    BanksResponse,
    DailyCount,
    OwnerUsageResponse,
    StatusResponse,
    UsageResponse,
)
from ..responses import ADMIN_ERRORS
from ..state import AppState, get_state, require_admin, require_auth
from ..usage import compute_overage, kobo_to_naira_str, overage_report_for_owner

router = APIRouter(tags=["Account"])


@router.get("/v1/status", response_model=StatusResponse, summary="Worker and engine version")
async def status() -> StatusResponse:
    return StatusResponse(status="ok", worker_version=__version__, engine_version=ENGINE_VERSION)


@router.get("/v1/banks", response_model=BanksResponse, summary="List supported banks")
async def banks(_: AuthContext = Depends(require_auth)) -> BanksResponse:
    return BanksResponse(
        banks=[BankInfo(id=b) for b in list_supported_banks()],
        engine_version=ENGINE_VERSION,
    )


@router.get(
    "/v1/usage",
    response_model=UsageResponse,
    summary="Current billing-period usage",
)
async def usage(
    ctx: AuthContext = Depends(require_auth),
    state: AppState = Depends(get_state),
) -> UsageResponse:
    since = current_period_start_iso()
    # Cap + overage are per subscription (owner), so count across all the owner's keys.
    # A key without an owner (legacy/test) falls back to its own count, no cap.
    if ctx.owner:
        report = overage_report_for_owner(
            state.audit, state.subscriptions, ctx.owner, since_iso=since
        )
    else:
        own_parses = state.audit.count_success_for_key(ctx.api_key_id, since_iso=since)
        report = compute_overage(tier=None, period_parses=own_parses)
    return UsageResponse(
        api_key_id=ctx.api_key_id,
        tier=report.tier,
        period_parses=report.period_parses,
        monthly_cap=report.monthly_cap,
        overage_parses=report.overage_parses,
        projected_overage_naira=kobo_to_naira_str(report.overage_amount_kobo),
    )


@router.get(
    "/v1/admin/usage",
    response_model=OwnerUsageResponse,
    responses=ADMIN_ERRORS,
    summary="Owner usage aggregation (admin)",
    description="Admin-only. Aggregates audit metadata across all keys owned by `owner` "
    "for the current cycle. Powers the dashboard Overview + Usage.",
)
async def admin_usage(
    owner: str = Query(..., min_length=1),
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> OwnerUsageResponse:
    total, ok, daily = state.audit.owner_usage(owner, since_iso=current_period_start_iso())
    return OwnerUsageResponse(
        owner=owner,
        period_parses=ok,
        success_rate=round(ok / total, 4) if total else 0.0,
        daily=[DailyCount(date=d, count=c) for d, c in daily],
    )
