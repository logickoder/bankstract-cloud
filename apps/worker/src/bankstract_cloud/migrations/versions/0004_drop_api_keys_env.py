# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""drop api_keys.env: tier is the single stored truth

env duplicated tier for every row (live/live, test/test) until the first_party tier arrived
and proved the two could diverge, which made the duplicate column a drift bug waiting to
happen (a gate reading env instead of tier would bill a first_party key). The <env> segment
now exists only inside the key string itself, derived from tier at the single mint point
(auth.generate_api_key); no column and no API response carries it.

Image-rollback note: once a boot has stamped the DB at this revision, a container rolled back
to a pre-0004 image will crash-loop at startup (its alembic cannot resolve this revision id).
Recovery on the box:
    sqlite3 /data/audit.sqlite "ALTER TABLE api_keys ADD COLUMN env TEXT NOT NULL DEFAULT 'live';
        UPDATE api_keys SET env = 'test' WHERE tier = 'test';
        UPDATE alembic_version SET version_num = '0003_pending_activations';"
(i.e. this file's downgrade() plus re-stamping), or restore the nightly R2 backup.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0004_drop_api_keys_env"
down_revision: str | None = "0003_pending_activations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE api_keys DROP COLUMN env")


def downgrade() -> None:
    op.execute("ALTER TABLE api_keys ADD COLUMN env TEXT NOT NULL DEFAULT 'live'")
    op.execute("UPDATE api_keys SET env = 'test' WHERE tier = 'test'")
