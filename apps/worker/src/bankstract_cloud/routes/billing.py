# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import json
import logging
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response

from ..audit import current_period_start_iso
from ..models import (
    OverageChargeResponse,
    SubscribeRequest,
    SubscribeResponse,
    SubscriptionStatusResponse,
)
from ..paystack import PaystackError
from ..responses import ADMIN_ERRORS
from ..state import AppState, get_state, require_admin
from ..subscriptions import apply_webhook_event
from ..usage import overage_report_for_owner

logger = logging.getLogger("bankstract_cloud.billing")

router = APIRouter(tags=["Billing"])


@router.post(
    "/v1/admin/billing/subscribe",
    response_model=SubscribeResponse,
    responses=ADMIN_ERRORS,
    summary="Start a subscription checkout (admin)",
    description="Admin-only. Initializes a Paystack transaction for the tier's plan and returns "
    "inline-checkout params. apps/app proxies this; the Paystack secret stays worker-side.",
)
async def admin_subscribe(
    body: SubscribeRequest,
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> SubscribeResponse:
    plan_code = state.settings.plan_for(body.tier, body.interval)
    if not plan_code:
        raise HTTPException(
            status_code=503, detail=f"tier {body.tier} ({body.interval}) not configured"
        )
    try:
        params = await state.paystack.init_subscription(
            email=body.email,
            plan_code=plan_code,
            owner=body.owner,
            callback_url=body.callback_url,
        )
    except PaystackError as exc:
        logger.warning("paystack subscribe failed for owner %s: %s", body.owner, exc)
        raise HTTPException(status_code=502, detail="payment init failed") from exc
    return SubscribeResponse(
        authorization_url=params["authorization_url"],
        access_code=params["access_code"],
        reference=params["reference"],
    )


@router.get(
    "/v1/admin/billing/status",
    response_model=SubscriptionStatusResponse,
    responses=ADMIN_ERRORS,
    summary="Owner subscription status (admin)",
    description="Admin-only. The owner's tier, status (active/inactive/none), and current period "
    "end. The dashboard reads this; the worker is the source of truth.",
)
async def admin_subscription_status(
    owner: str = Query(..., min_length=1),
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> SubscriptionStatusResponse:
    s = state.subscriptions.status_for_owner(owner)
    return SubscriptionStatusResponse(
        owner=s.owner, tier=s.tier, status=s.status, current_period_end=s.current_period_end
    )


@router.post(
    "/v1/admin/billing/charge-overage",
    response_model=OverageChargeResponse,
    responses=ADMIN_ERRORS,
    summary="Bill the owner's current overage (admin, manual)",
    description="Admin-only. Computes this cycle's overage from audit success counts and "
    "raises a Paystack invoice for it. Manual trigger until an end-of-cycle cron lands.",
)
async def admin_charge_overage(
    owner: str = Query(..., min_length=1),
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> OverageChargeResponse:
    report = overage_report_for_owner(
        state.audit, state.subscriptions, owner, since_iso=current_period_start_iso()
    )
    if report.overage_amount_kobo <= 0:
        return OverageChargeResponse(owner=owner, overage_parses=0, request_code=None)
    customer = state.subscriptions.customer_code_for_owner(owner)
    if not customer:
        raise HTTPException(status_code=404, detail="no Paystack customer for owner")
    try:
        request_code = await state.paystack.create_invoice(
            customer_code=customer,
            amount_kobo=report.overage_amount_kobo,
            description=f"bankstract overage: {report.overage_parses} parses",
        )
    except PaystackError as exc:
        logger.warning("overage invoice failed for owner %s: %s", owner, exc)
        raise HTTPException(status_code=502, detail="overage invoice failed") from exc
    return OverageChargeResponse(
        owner=owner, overage_parses=report.overage_parses, request_code=request_code
    )


@router.post("/v1/billing/webhook", include_in_schema=False)
async def paystack_webhook(request: Request, state: AppState = Depends(get_state)) -> Response:
    # Public endpoint. Trust is established by the HMAC-SHA512 signature over the raw body,
    # never by network origin. Verify before parsing; dedup before applying.
    body = await request.body()
    if not state.paystack.verify_webhook(body, request.headers.get("x-paystack-signature")):
        raise HTTPException(status_code=401, detail="invalid signature")
    parsed: Any = json.loads(body) if body else None
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=400, detail="malformed payload")
    event = cast("dict[str, Any]", parsed)
    event_type = str(event.get("event", ""))
    data_raw = event.get("data")
    if not isinstance(data_raw, dict):
        return Response(status_code=200)
    data = cast("dict[str, Any]", data_raw)
    # Paystack sends no event id; dedup on event type + the data object's id (txn/sub id).
    if not state.subscriptions.record_event(f"{event_type}:{data.get('id')}"):
        return Response(status_code=200)
    apply_webhook_event(
        state.subscriptions, event_type, data, tier_by_plan=state.settings.tier_by_paystack_plan
    )
    return Response(status_code=200)
