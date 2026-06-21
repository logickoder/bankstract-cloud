# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime


def current_period_start_iso() -> str:
    """Start of the current billing cycle (UTC month boundary), ISO-8601. Usage and
    admin-usage scope their audit counts from here."""
    now = datetime.now(UTC)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()


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
                datetime.now(UTC).isoformat(),
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
        self, owner: str, *, since_iso: str
    ) -> tuple[int, int, list[tuple[str, int]]]:
        """Aggregate across all keys owned by `owner` since `since_iso`. Returns
        (total_attempts, successes, [(YYYY-MM-DD, success_count), ...]). The JOIN drops
        the anonymous demo key (no matching api_keys row), so this is owner-real only.
        """
        totals = self._conn.execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(a.success), 0) AS ok "
            "FROM audit_log a JOIN api_keys k ON a.api_key_id = k.id "
            "WHERE k.owner = ? AND a.timestamp >= ?",
            (owner, since_iso),
        ).fetchone()
        total = int(totals["total"]) if totals else 0
        ok = int(totals["ok"]) if totals else 0
        daily = self._conn.execute(
            "SELECT substr(a.timestamp, 1, 10) AS day, COUNT(*) AS n "
            "FROM audit_log a JOIN api_keys k ON a.api_key_id = k.id "
            "WHERE k.owner = ? AND a.timestamp >= ? AND a.success = 1 "
            "GROUP BY day ORDER BY day",
            (owner, since_iso),
        ).fetchall()
        return total, ok, [(r["day"], int(r["n"])) for r in daily]
