# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
import time

# Fixed-window counter. Anonymous demo surface = 50 parses/month per IP (PRD).
# Keyed by an opaque bucket (e.g. "demo:<ip>"); no PDF or identity payload stored.


class RateLimiter:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn

    @staticmethod
    def seconds_until_reset(window_seconds: int) -> int:
        """Seconds until the current fixed window rolls over (the Retry-After value on a 429)."""
        now = int(time.time())
        window_start = now - (now % window_seconds)
        return window_start + window_seconds - now

    def check(self, bucket: str, *, max_count: int, window_seconds: int) -> bool:
        now = int(time.time())
        window_start = now - (now % window_seconds)

        with self._conn:
            self._conn.execute(
                "INSERT INTO rate_limit (bucket, window_start, count) VALUES (?, ?, 0) "
                "ON CONFLICT(bucket, window_start) DO NOTHING",
                (bucket, window_start),
            )
            row = self._conn.execute(
                "SELECT count FROM rate_limit WHERE bucket = ? AND window_start = ?",
                (bucket, window_start),
            ).fetchone()
            current = int(row["count"]) if row else 0
            if current >= max_count:
                return False
            self._conn.execute(
                "UPDATE rate_limit SET count = count + 1 WHERE bucket = ? AND window_start = ?",
                (bucket, window_start),
            )

        self._conn.execute(
            "DELETE FROM rate_limit WHERE window_start < ?",
            (window_start - window_seconds,),
        )
        self._conn.commit()
        return True
