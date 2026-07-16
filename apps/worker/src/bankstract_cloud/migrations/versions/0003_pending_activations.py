# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""pending_activations: reconcile subscription.create that arrives before charge.success

Revision ID: 0003_pending_activations
Revises: 0002_overage_billing
Create Date: 2026-07-16

Paystack does not guarantee webhook ordering. `charge.success` carries our owner metadata and
binds owner <-> customer_code (map_customer); `subscription.create` carries only customer_code and
activates the row. If subscription.create lands first, there is no row to activate and the
activation is lost. This table parks a customer-keyed activation until charge.success maps the
owner, then map_customer applies and clears it. Metadata only (Directive 1): no payload columns.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0003_pending_activations"
down_revision: str | None = "0002_overage_billing"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_UPGRADE = (
    """
    CREATE TABLE pending_activations (
        customer_code      TEXT PRIMARY KEY,
        subscription_code  TEXT,
        plan_code          TEXT,
        tier               TEXT,
        current_period_end TEXT,
        received_at        TEXT NOT NULL
    )
    """,
)

_DOWNGRADE = ("DROP TABLE pending_activations",)


def upgrade() -> None:
    for stmt in _UPGRADE:
        op.execute(stmt)


def downgrade() -> None:
    for stmt in _DOWNGRADE:
        op.execute(stmt)
