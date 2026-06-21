# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from dataclasses import dataclass

from .audit import AuditLog
from .subscriptions import SubscriptionStore
from .tiers import TIERS


@dataclass(frozen=True)
class OverageReport:
    tier: str | None
    monthly_cap: int | None
    period_parses: int
    overage_parses: int
    overage_amount_kobo: int


def compute_overage(*, tier: str | None, period_parses: int) -> OverageReport:
    """Overage for one billing cycle. period_parses is the SUCCESS count across all of an
    owner's keys (failures never count). Unknown/None tier (test key, no subscription) has
    no cap and no overage."""
    t = TIERS.get(tier) if tier else None
    if t is None:
        return OverageReport(
            tier=tier,
            monthly_cap=None,
            period_parses=period_parses,
            overage_parses=0,
            overage_amount_kobo=0,
        )
    overage = max(0, period_parses - t.monthly_cap)
    return OverageReport(
        tier=t.name,
        monthly_cap=t.monthly_cap,
        period_parses=period_parses,
        overage_parses=overage,
        overage_amount_kobo=overage * t.overage_kobo,
    )


def overage_report_for_owner(
    audit: AuditLog, subscriptions: SubscriptionStore, owner: str, *, since_iso: str
) -> OverageReport:
    """Overage for an owner this cycle: success count across all their keys, against the
    tier cap from their subscription. Used by /v1/usage and the manual overage charge."""
    _total, period_parses, _daily = audit.owner_usage(owner, since_iso=since_iso)
    tier = subscriptions.status_for_owner(owner).tier
    return compute_overage(tier=tier, period_parses=period_parses)


def kobo_to_naira_str(kobo: int) -> str:
    # Exact NGN string, no float drift, e.g. 153050 -> "1530.50".
    return f"{kobo // 100}.{kobo % 100:02d}"
