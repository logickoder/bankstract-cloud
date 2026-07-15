# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3


def purge_owner_data(conn: sqlite3.Connection, owner: str) -> None:
    """Delete every row tied to an owner across the worker DB (right to erasure, NDPR, /privacy).
    audit_log is keyed by api_key_id, so delete it via the owner's keys before the keys go. One
    transaction: either all of it lands or none of it does. Does NOT touch Paystack (the caller
    cancels any live subscription first) or the web auth DB (the web app deletes that)."""
    with conn:
        conn.execute(
            "DELETE FROM audit_log WHERE api_key_id IN (SELECT id FROM api_keys WHERE owner = ?)",
            (owner,),
        )
        conn.execute("DELETE FROM api_keys WHERE owner = ?", (owner,))
        conn.execute("DELETE FROM subscriptions WHERE owner = ?", (owner,))
        conn.execute("DELETE FROM cycle_tiers WHERE owner = ?", (owner,))
        conn.execute("DELETE FROM overage_invoices WHERE owner = ?", (owner,))
