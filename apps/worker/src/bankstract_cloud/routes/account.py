# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import __version__
from ..audit import current_period_start_iso, pad_daily
from ..auth import AuthContext
from ..engine import ENGINE_VERSION, list_supported_banks
from ..metrics import funnel
from ..models import (
    BankInfo,
    BanksResponse,
    DailyCount,
    FunnelResponse,
    OwnerUsageResponse,
    StatusResponse,
    UsageResponse,
)
from ..owner import purge_owner_data
from ..paystack import PaystackError
from ..responses import ADMIN_ERRORS
from ..state import AppState, get_state, require_admin, require_auth
from ..usage import compute_overage, kobo_to_naira_str, overage_report_for_owner

router = APIRouter(tags=["Account"])


@router.get(
    "/v1/status",
    response_model=StatusResponse,
    summary="Worker and engine version",
    description="Returns the running worker version and the bundled bankstract engine version.",
)
async def status() -> StatusResponse:
    return StatusResponse(status="ok", worker_version=__version__, engine_version=ENGINE_VERSION)


@router.get(
    "/v1/banks",
    response_model=BanksResponse,
    summary="List supported banks",
    description="The bank ids the engine can auto-detect, for the optional `bank` parse override.",
)
async def banks(_: AuthContext = Depends(require_auth)) -> BanksResponse:
    return BanksResponse(
        banks=[BankInfo(id=b) for b in list_supported_banks()],
        engine_version=ENGINE_VERSION,
    )


@router.get(
    "/v1/usage",
    response_model=UsageResponse,
    summary="Current billing-period usage",
    description="Successful parses across the key owner's keys this cycle, the tier cap, and the "
    "projected overage in NGN. Failed parses never count.",
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
    since_iso = current_period_start_iso()
    total, ok, daily = state.audit.owner_usage(owner, since_iso=since_iso)
    # Same overage math as /v1/usage (compute_overage), so the dashboard figure and the
    # invoice never disagree (Directive 6). Cap comes from the owner's subscription tier.
    tier = state.subscriptions.status_for_owner(owner).tier
    report = compute_overage(tier=tier, period_parses=ok)
    return OwnerUsageResponse(
        owner=owner,
        tier=report.tier,
        period_parses=ok,
        success_rate=round(ok / total, 4) if total else 0.0,
        monthly_cap=report.monthly_cap,
        overage_parses=report.overage_parses,
        projected_overage_naira=kobo_to_naira_str(report.overage_amount_kobo),
        daily=[DailyCount(date=d, count=c) for d, c in pad_daily(daily, since_iso=since_iso)],
    )


@router.get(
    "/v1/admin/metrics",
    response_model=FunnelResponse,
    responses=ADMIN_ERRORS,
    summary="Operator funnel metrics (admin)",
    description="Admin-only. The usage-to-paid funnel derived from existing metadata: demo parses, "
    "API parses, owners with a key, and active subscriptions. No client tracking.",
)
async def admin_metrics(
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> FunnelResponse:
    f = funnel(state.conn)
    return FunnelResponse(
        demo_parses=f.demo_parses,
        api_parses=f.api_parses,
        owners=f.owners,
        active_subscriptions=f.active_subscriptions,
    )


@router.delete(
    "/v1/admin/owner",
    responses=ADMIN_ERRORS,
    summary="Erase an owner's data (admin)",
    description="Admin-only. Cancels any live Paystack subscription, then deletes every row tied "
    "to `owner` (keys, subscription, cycle tiers, invoices, audit metadata). Right to erasure "
    "(NDPR). If the Paystack cancel fails, nothing is deleted (a live charge is never orphaned).",
)
async def delete_owner(
    owner: str = Query(..., min_length=1),
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> dict[str, bool]:
    # Cancel any Paystack subscription BEFORE purging local data, so a live charge is never
    # orphaned. Cancel whenever a subscription_code exists, regardless of our LOCAL status: a
    # failed renewal deactivates us locally (charter D3, no dunning grace) while Paystack keeps
    # the subscription live and retries the card. disable_subscription is idempotent.
    code = state.subscriptions.subscription_code_for_owner(owner)
    status = state.subscriptions.status_for_owner(owner).status
    if code:
        if state.paystack.enabled:
            try:
                await state.paystack.disable_subscription(code)
            except PaystackError as exc:
                raise HTTPException(
                    status_code=502, detail=f"could not cancel subscription: {exc}"
                ) from exc
    elif status == "active":
        # Active locally but no subscription_code to cancel with. Refuse rather than purge and
        # leave a live Paystack subscription billing a card with no local record.
        raise HTTPException(
            status_code=409,
            detail="cannot cancel the subscription automatically; contact support before deleting",
        )
    purge_owner_data(state.conn, owner)
    return {"ok": True}
