# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

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
