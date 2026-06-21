# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""baseline: api_keys, audit_log, rate_limit, subscriptions, webhook_events

Revision ID: 0001_baseline
Revises:
Create Date: 2026-06-21

The schema floor. A 1:1 of the privacy-audited tables that db.py used to create. Directive 1:
metadata only, NO column for transactions / account holders / balances / any PDF payload.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0001_baseline"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_UPGRADE = (
    """
    CREATE TABLE api_keys (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        lookup_prefix TEXT NOT NULL,
        key_hash      TEXT NOT NULL,
        env           TEXT NOT NULL,
        tier          TEXT NOT NULL,
        owner         TEXT,
        created_at    TEXT NOT NULL,
        revoked_at    TEXT
    )
    """,
    "CREATE INDEX idx_api_keys_lookup ON api_keys(lookup_prefix)",
    "CREATE INDEX idx_api_keys_owner ON api_keys(owner)",
    """
    CREATE TABLE audit_log (
        id              TEXT PRIMARY KEY,
        timestamp       TEXT NOT NULL,
        api_key_id      TEXT NOT NULL,
        filename        TEXT,
        byte_count      INTEGER NOT NULL,
        parser_detected TEXT,
        success         INTEGER NOT NULL,
        error_class     TEXT
    )
    """,
    "CREATE INDEX idx_audit_key_time ON audit_log(api_key_id, timestamp)",
    """
    CREATE TABLE rate_limit (
        bucket       TEXT NOT NULL,
        window_start INTEGER NOT NULL,
        count        INTEGER NOT NULL,
        PRIMARY KEY (bucket, window_start)
    )
    """,
    """
    CREATE TABLE subscriptions (
        owner              TEXT PRIMARY KEY,
        customer_code      TEXT,
        subscription_code  TEXT,
        plan_code          TEXT,
        tier               TEXT,
        status             TEXT NOT NULL,
        current_period_end TEXT,
        updated_at         TEXT NOT NULL
    )
    """,
    "CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_code)",
    """
    CREATE TABLE webhook_events (
        event_key   TEXT PRIMARY KEY,
        received_at TEXT NOT NULL
    )
    """,
)

_DOWNGRADE = (
    "DROP TABLE webhook_events",
    "DROP TABLE subscriptions",
    "DROP TABLE rate_limit",
    "DROP TABLE audit_log",
    "DROP TABLE api_keys",
)


def upgrade() -> None:
    for stmt in _UPGRADE:
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _DOWNGRADE:
        op.execute(stmt)
