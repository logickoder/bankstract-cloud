# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
from dataclasses import dataclass


# The usage-to-paid funnel, derived entirely from data we already keep (audit_log, api_keys,
# subscriptions). No new tracking, no client analytics. The anonymous demo key has no api_keys
# row, so demo parses are exactly the audit rows that do not join to a real key.
@dataclass(frozen=True)
class Funnel:
    demo_parses: int
    api_parses: int
    owners: int
    active_subscriptions: int


def funnel(conn: sqlite3.Connection) -> Funnel:
    def count(sql: str) -> int:
        row = conn.execute(sql).fetchone()
        return int(row[0]) if row else 0

    return Funnel(
        demo_parses=count(
            "SELECT COUNT(*) FROM audit_log WHERE api_key_id NOT IN (SELECT id FROM api_keys)"
        ),
        api_parses=count("SELECT COUNT(*) FROM audit_log a JOIN api_keys k ON a.api_key_id = k.id"),
        owners=count("SELECT COUNT(DISTINCT owner) FROM api_keys WHERE owner IS NOT NULL"),
        active_subscriptions=count("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"),
    )
