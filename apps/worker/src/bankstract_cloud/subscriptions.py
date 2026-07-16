# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from typing import Any, cast

from .clock import utcnow_iso

_ACTIVE = "active"
_INACTIVE = "inactive"
_NONE = "none"


@dataclass(frozen=True)
class SubscriptionStatus:
    owner: str
    tier: str | None
    status: str  # "active" | "inactive" | "none"
    current_period_end: str | None


class SubscriptionStore:
    """SQLite-backed Paystack subscription state, keyed by owner. The worker is the source
    of truth for enforcement; the dashboard reads it. No PDF payload data (Directive 1)."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def status_for_owner(self, owner: str) -> SubscriptionStatus:
        row = self._conn.execute(
            "SELECT tier, status, current_period_end FROM subscriptions WHERE owner = ?",
            (owner,),
        ).fetchone()
        if row is None:
            return SubscriptionStatus(owner=owner, tier=None, status=_NONE, current_period_end=None)
        return SubscriptionStatus(
            owner=owner,
            tier=row["tier"],
            status=row["status"],
            current_period_end=row["current_period_end"],
        )

    def is_active(self, owner: str) -> bool:
        return self.status_for_owner(owner).status == _ACTIVE

    def customer_code_for_owner(self, owner: str) -> str | None:
        row = self._conn.execute(
            "SELECT customer_code FROM subscriptions WHERE owner = ?", (owner,)
        ).fetchone()
        return row["customer_code"] if row else None

    def subscription_code_for_owner(self, owner: str) -> str | None:
        row = self._conn.execute(
            "SELECT subscription_code FROM subscriptions WHERE owner = ?", (owner,)
        ).fetchone()
        return row["subscription_code"] if row else None

    def billable_owners(self) -> list[tuple[str, str, str]]:
        # (owner, customer_code, tier) for owners that can be billed: a Paystack customer is
        # mapped and a tier is set. Drives the overage cron's per-cycle tier snapshot.
        rows = self._conn.execute(
            "SELECT owner, customer_code, tier FROM subscriptions "
            "WHERE customer_code IS NOT NULL AND tier IS NOT NULL"
        ).fetchall()
        return [(r["owner"], r["customer_code"], r["tier"]) for r in rows]

    def record_event(self, event_key: str) -> bool:
        # Idempotency ledger: True if newly recorded, False if this delivery was already seen.
        try:
            self._conn.execute(
                "INSERT INTO webhook_events (event_key, received_at) VALUES (?, ?)",
                (event_key, utcnow_iso()),
            )
            self._conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def map_customer(self, *, owner: str, customer_code: str) -> None:
        # First contact (charge.success): bind owner <-> customer_code so later
        # customer-keyed events resolve. Preserves an existing status (never downgrades).
        self._conn.execute(
            "INSERT INTO subscriptions (owner, customer_code, status, updated_at) "
            "VALUES (?, ?, ?, ?) "
            "ON CONFLICT(owner) DO UPDATE SET customer_code = excluded.customer_code, "
            "updated_at = excluded.updated_at",
            (owner, customer_code, _INACTIVE, utcnow_iso()),
        )
        self._conn.commit()
        # A subscription.create may have raced ahead of this charge.success and parked its
        # activation (no owner row existed to update). Now the row exists: apply and clear it.
        self._apply_pending(customer_code)

    def activate(
        self,
        *,
        customer_code: str,
        subscription_code: str | None,
        plan_code: str | None,
        tier: str | None,
        current_period_end: str | None,
    ) -> None:
        cur = self._conn.execute(
            "UPDATE subscriptions SET subscription_code = ?, plan_code = ?, tier = ?, "
            "status = ?, current_period_end = ?, updated_at = ? WHERE customer_code = ?",
            (
                subscription_code,
                plan_code,
                tier,
                _ACTIVE,
                current_period_end,
                utcnow_iso(),
                customer_code,
            ),
        )
        if cur.rowcount == 0:
            # subscription.create raced ahead of charge.success: no owner row for this customer
            # yet. Park the activation; map_customer applies it once the owner is known.
            self._conn.execute(
                "INSERT INTO pending_activations "
                "(customer_code, subscription_code, plan_code, tier, current_period_end, "
                "received_at) VALUES (?, ?, ?, ?, ?, ?) "
                "ON CONFLICT(customer_code) DO UPDATE SET subscription_code = "
                "excluded.subscription_code, plan_code = excluded.plan_code, "
                "tier = excluded.tier, current_period_end = excluded.current_period_end, "
                "received_at = excluded.received_at",
                (
                    customer_code,
                    subscription_code,
                    plan_code,
                    tier,
                    current_period_end,
                    utcnow_iso(),
                ),
            )
        self._conn.commit()

    def _apply_pending(self, customer_code: str) -> None:
        row = self._conn.execute(
            "SELECT subscription_code, plan_code, tier, current_period_end "
            "FROM pending_activations WHERE customer_code = ?",
            (customer_code,),
        ).fetchone()
        if row is None:
            return
        self._conn.execute(
            "UPDATE subscriptions SET subscription_code = ?, plan_code = ?, tier = ?, "
            "status = ?, current_period_end = ?, updated_at = ? WHERE customer_code = ?",
            (
                row["subscription_code"],
                row["plan_code"],
                row["tier"],
                _ACTIVE,
                row["current_period_end"],
                utcnow_iso(),
                customer_code,
            ),
        )
        self._conn.execute(
            "DELETE FROM pending_activations WHERE customer_code = ?", (customer_code,)
        )
        self._conn.commit()

    def deactivate_by_customer(self, customer_code: str) -> None:
        self._conn.execute(
            "UPDATE subscriptions SET status = ?, updated_at = ? WHERE customer_code = ?",
            (_INACTIVE, utcnow_iso(), customer_code),
        )
        # Drop any parked activation: a disable must not be undone later by a pending row that
        # raced in before the owner mapping existed.
        self._conn.execute(
            "DELETE FROM pending_activations WHERE customer_code = ?", (customer_code,)
        )
        self._conn.commit()


def apply_webhook_event(
    store: SubscriptionStore,
    event_type: str,
    data: dict[str, Any],
    *,
    tier_by_plan: dict[str, str],
) -> None:
    """Map a verified Paystack event onto subscription state. Unknown events are ignored.
    Deactivation is immediate on payment failure / disable (no dunning grace, charter D3)."""
    customer_code = _nested(data, "customer", "customer_code")

    if event_type == "charge.success":
        owner = _nested(data, "metadata", "owner")
        if owner and customer_code:
            store.map_customer(owner=owner, customer_code=customer_code)
        return

    if event_type == "subscription.create":
        if not customer_code:
            return
        plan_code = _nested(data, "plan", "plan_code")
        store.activate(
            customer_code=customer_code,
            subscription_code=_opt_str(data.get("subscription_code")),
            plan_code=plan_code,
            tier=tier_by_plan.get(plan_code) if plan_code else None,
            current_period_end=_opt_str(data.get("next_payment_date")),
        )
        return

    deactivating = ("subscription.disable", "subscription.not_renew", "invoice.payment_failed")
    if event_type in deactivating and customer_code:
        store.deactivate_by_customer(customer_code)


def _opt_str(value: Any) -> str | None:
    return None if value is None else str(value)


def _nested(data: dict[str, Any], outer: str, inner: str) -> str | None:
    obj = data.get(outer)
    if isinstance(obj, dict):
        return _opt_str(cast("dict[str, Any]", obj).get(inner))
    return None
