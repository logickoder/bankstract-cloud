# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from .clock import utcnow_iso


# DELIBERATE: the overage metering window is the CALENDAR MONTH (UTC, 1st 00:00 to 1st
# 00:00), NOT the Paystack subscription cycle anchored to each owner's subscribe date.
# Consequences, accepted for v1:
#   - The included-parse cap resets on the 1st for everyone, independent of signup date.
#   - The overage invoice date (cycle close) does not align with the base-fee renewal date
#     (Paystack charges that on the subscription anchor). Two charges, two dates.
# The load-bearing invariant: this window is the SINGLE definition shared by /v1/usage (what
# the customer sees) and the overage cron (what we bill). They must never diverge, or a
# customer sees "0 overage" on the dashboard then receives an invoice. Anything reading an
# owner's cycle goes through these helpers. To move to subscription-anchored cycles, change
# them here AND add Paystack renewal tracking (we store current_period_end once at
# subscription.create and never advance it) AND make the cron compute per-owner windows.
def _month_start(dt: datetime) -> datetime:
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def current_period_start_iso() -> str:
    """Start of the current billing cycle (UTC calendar-month boundary), ISO-8601. Usage and
    admin-usage scope their audit counts from here. Calendar month is deliberate, not the
    Paystack subscription anchor: see the module note above."""
    return _month_start(datetime.now(UTC)).isoformat()


def previous_period_bounds(asof: datetime) -> tuple[str, str]:
    """The billing cycle that just closed relative to `asof`, as [since, until) ISO-8601 UTC
    bounds. `until` is exclusive and equals the current cycle start. `asof` must be tz-aware."""
    this_start = _month_start(asof.astimezone(UTC))
    prev_start = _month_start(this_start - timedelta(days=1))
    return prev_start.isoformat(), this_start.isoformat()


# Directive 1: metadata only. There is deliberately NO column for transactions,
# account holders, balances, or any PDF-derived payload. Do not add one.


@dataclass(frozen=True)
class AuditEntry:
    api_key_id: str
    filename: str | None
    byte_count: int
    parser_detected: str | None
    success: bool
    error_class: str | None


class AuditLog:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def record(self, entry: AuditEntry) -> None:
        self._conn.execute(
            "INSERT INTO audit_log (id, timestamp, api_key_id, filename, "
            "byte_count, parser_detected, success, error_class) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                uuid.uuid4().hex,
                utcnow_iso(),
                entry.api_key_id,
                entry.filename,
                entry.byte_count,
                entry.parser_detected,
                int(entry.success),
                entry.error_class,
            ),
        )
        self._conn.commit()

    def count_success_for_key(self, api_key_id: str, *, since_iso: str) -> int:
        row = self._conn.execute(
            "SELECT COUNT(*) AS n FROM audit_log "
            "WHERE api_key_id = ? AND success = 1 AND timestamp >= ?",
            (api_key_id, since_iso),
        ).fetchone()
        return int(row["n"]) if row else 0

    def owner_usage(
        self, owner: str, *, since_iso: str, until_iso: str | None = None
    ) -> tuple[int, int, list[tuple[str, int]]]:
        """Aggregate across all keys owned by `owner` over [since_iso, until_iso). `until_iso`
        is exclusive; None means open-ended (current cycle to now). Returns (total_attempts,
        successes, [(YYYY-MM-DD, success_count), ...]). The JOIN drops the anonymous demo key
        (no matching api_keys row), so this is owner-real only. A bounded window is what lets
        the overage cron bill a closed cycle without new-cycle parses leaking in.
        """
        upper = ""
        extra: tuple[str, ...] = ()
        if until_iso is not None:
            upper = " AND a.timestamp < ?"
            extra = (until_iso,)
        totals = self._conn.execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(a.success), 0) AS ok "
            "FROM audit_log a JOIN api_keys k ON a.api_key_id = k.id "
            "WHERE k.owner = ? AND a.timestamp >= ?" + upper,
            (owner, since_iso, *extra),
        ).fetchone()
        total = int(totals["total"]) if totals else 0
        ok = int(totals["ok"]) if totals else 0
        daily = self._conn.execute(
            "SELECT substr(a.timestamp, 1, 10) AS day, COUNT(*) AS n "
            "FROM audit_log a JOIN api_keys k ON a.api_key_id = k.id "
            "WHERE k.owner = ? AND a.timestamp >= ?" + upper + " AND a.success = 1 "
            "GROUP BY day ORDER BY day",
            (owner, since_iso, *extra),
        ).fetchall()
        return total, ok, [(r["day"], int(r["n"])) for r in daily]
