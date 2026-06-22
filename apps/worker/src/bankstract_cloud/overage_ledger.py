# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3

from .clock import utcnow_iso


class CycleTierStore:
    """Per-cycle frozen tier economics. The cap + overage rate are denormalized in (not an FK
    to TIERS) so a closed cycle's invoice is computed from the numbers that applied THEN, not
    whatever TIERS says at bill time. Directive 1: metadata only, no PDF payload."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def snapshot(
        self, *, owner: str, period_start: str, tier: str, monthly_cap: int, overage_kobo: int
    ) -> None:
        # Write-once: the first observation of an owner in a cycle wins. A later tier change
        # within the same cycle does not overwrite (Paystack churns the subscription on a plan
        # change, so a mid-cycle tier swap is sub re-creation, not an in-place edit).
        self._conn.execute(
            "INSERT OR IGNORE INTO cycle_tiers "
            "(owner, period_start, tier, monthly_cap, overage_kobo) VALUES (?, ?, ?, ?, ?)",
            (owner, period_start, tier, monthly_cap, overage_kobo),
        )
        self._conn.commit()

    def tiers_for_period(self, period_start: str) -> list[tuple[str, str, int, int]]:
        # (owner, tier, monthly_cap, overage_kobo) for every owner snapshotted in this cycle.
        rows = self._conn.execute(
            "SELECT owner, tier, monthly_cap, overage_kobo FROM cycle_tiers WHERE period_start = ?",
            (period_start,),
        ).fetchall()
        return [
            (r["owner"], r["tier"], int(r["monthly_cap"]), int(r["overage_kobo"])) for r in rows
        ]


class OverageLedger:
    """Idempotency ledger: one row per (owner, cycle) once the overage is settled. A second run
    for the same cycle is a no-op, so the daily scheduler can fire repeatedly and survive
    restarts without double-billing. Directive 1: metadata only, no PDF payload."""

    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    def already_billed(self, owner: str, period_start: str) -> bool:
        row = self._conn.execute(
            "SELECT 1 FROM overage_invoices WHERE owner = ? AND period_start = ?",
            (owner, period_start),
        ).fetchone()
        return row is not None

    def record(self, *, owner: str, period_start: str, request_code: str | None) -> bool:
        # True if newly recorded, False if this cycle was already settled (PK conflict). The
        # INSERT, not the prior already_billed check, is the real race guard.
        try:
            self._conn.execute(
                "INSERT INTO overage_invoices (owner, period_start, request_code, created_at) "
                "VALUES (?, ?, ?, ?)",
                (owner, period_start, request_code, utcnow_iso()),
            )
            self._conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
