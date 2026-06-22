# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from .audit import previous_period_bounds
from .paystack import PaystackError
from .state import AppState
from .tiers import TIERS
from .usage import overage_for

logger = logging.getLogger("bankstract_cloud.billing_cron")

# Daily tick hour (UTC). The idempotency ledger makes the exact hour irrelevant: this only
# bounds how soon after a cycle closes the invoice goes out and how fast a restart catches up.
_TICK_HOUR_UTC = 2


@dataclass(frozen=True)
class OverageBillingResult:
    owner: str
    period_start: str
    overage_parses: int
    overage_amount_kobo: int
    request_code: str | None  # None when nothing was owed (cycle still recorded as settled)


async def run_overage_billing(state: AppState, *, asof: datetime) -> list[OverageBillingResult]:
    """Freeze the live cycle's tier economics, then invoice the just-closed cycle's overage.

    Idempotent per (owner, cycle): a re-run for an already-settled cycle is a no-op, so it is
    safe to call daily and on every boot (catch-up). No-op when Paystack is unconfigured
    (dev/test): no fake charges (Directive 6). Reads audit success counts only, never PDF
    payload (Directive 1).
    """
    if not state.paystack.enabled:
        return []

    since, cur_start = previous_period_bounds(asof)

    # 1. Freeze each active owner's tier economics for the CURRENT cycle while it is live, so
    #    when this cycle later closes it is billed against the cap + rate that applied now.
    for owner, _customer, tier in state.subscriptions.billable_owners():
        t = TIERS.get(tier)
        if t is None:
            continue
        state.cycle_tiers.snapshot(
            owner=owner,
            period_start=cur_start,
            tier=t.name,
            monthly_cap=t.monthly_cap,
            overage_kobo=t.overage_kobo,
        )

    # 2. Bill the CLOSED cycle off its frozen snapshot, bounded to [since, cur_start).
    results: list[OverageBillingResult] = []
    for owner, tier, monthly_cap, overage_kobo in state.cycle_tiers.tiers_for_period(since):
        if state.overage_ledger.already_billed(owner, since):
            continue
        _total, parses, _daily = state.audit.owner_usage(
            owner, since_iso=since, until_iso=cur_start
        )
        overage, amount = overage_for(parses, monthly_cap=monthly_cap, overage_kobo=overage_kobo)
        request_code: str | None = None
        if amount > 0:
            customer = state.subscriptions.customer_code_for_owner(owner)
            if not customer:
                logger.warning("overage for owner %s but no Paystack customer; skipping", owner)
                continue
            try:
                request_code = await state.paystack.create_invoice(
                    customer_code=customer,
                    amount_kobo=amount,
                    description=f"bankstract overage: {overage} parses ({tier})",
                )
            except PaystackError as exc:
                # Leave the cycle unsettled (no ledger row) so the next tick retries.
                logger.warning("overage invoice failed for owner %s: %s", owner, exc)
                continue
        # Settle the cycle either way (a zero-overage cycle is still "done", so the next tick
        # skips it); only an actual invoice counts as a result.
        settled = state.overage_ledger.record(
            owner=owner, period_start=since, request_code=request_code
        )
        if settled and amount > 0:
            results.append(OverageBillingResult(owner, since, overage, amount, request_code))
    logger.info("overage billing for cycle %s: %d invoiced", since, len(results))
    return results


async def billing_scheduler(state: AppState) -> None:
    """Daily in-process ticker. First iteration is a boot catch-up; the idempotent ledger makes
    daily cadence and downtime self-healing. No external cron, so the self-host bundle stays
    self-contained. Disabled (returns) when Paystack is unconfigured."""
    if not state.paystack.enabled:
        logger.info("overage billing scheduler disabled (Paystack unconfigured)")
        return
    while True:
        try:
            await run_overage_billing(state, asof=datetime.now(UTC))
        except Exception:
            # A single bad run must never kill the loop; log and wait for the next tick.
            logger.exception("overage billing run failed")
        await asyncio.sleep(_seconds_until_next_tick(datetime.now(UTC)))


def _seconds_until_next_tick(now: datetime) -> float:
    target = now.replace(hour=_TICK_HOUR_UTC, minute=0, second=0, microsecond=0)
    if target <= now:
        target = target + timedelta(days=1)
    return (target - now).total_seconds()
