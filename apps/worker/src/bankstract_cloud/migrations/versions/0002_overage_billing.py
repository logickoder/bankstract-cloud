# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""overage billing: cycle_tiers (frozen per-cycle economics), overage_invoices (idempotency)

Revision ID: 0002_overage_billing
Revises: 0001_baseline
Create Date: 2026-06-22

Directive 1: metadata only, NO PDF payload columns. cycle_tiers freezes the cap + overage
rate that applied to a billing cycle, captured while the cycle is live, so a closed-cycle
invoice never drifts when TIERS (code) changes later. overage_invoices is the per-cycle
idempotency ledger that lets the daily scheduler re-run / survive restarts without double-billing.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0002_overage_billing"
down_revision: str | None = "0001_baseline"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_UPGRADE = (
    """
    CREATE TABLE cycle_tiers (
        owner        TEXT NOT NULL,
        period_start TEXT NOT NULL,
        tier         TEXT NOT NULL,
        monthly_cap  INTEGER NOT NULL,
        overage_kobo INTEGER NOT NULL,
        PRIMARY KEY (owner, period_start)
    )
    """,
    """
    CREATE TABLE overage_invoices (
        owner        TEXT NOT NULL,
        period_start TEXT NOT NULL,
        request_code TEXT,
        created_at   TEXT NOT NULL,
        PRIMARY KEY (owner, period_start)
    )
    """,
)

_DOWNGRADE = (
    "DROP TABLE overage_invoices",
    "DROP TABLE cycle_tiers",
)


def upgrade() -> None:
    for stmt in _UPGRADE:
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _DOWNGRADE:
        op.execute(stmt)
