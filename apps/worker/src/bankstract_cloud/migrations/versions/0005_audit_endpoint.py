# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""audit_log.endpoint: tell /v1/parse rows from /v1/inspect rows

Revision ID: 0005_audit_endpoint
Revises: 0004_drop_api_keys_env
Create Date: 2026-10-12

/v1/inspect records the same metadata row as /v1/parse and counts as one parse (docs/rules/api.md).
This column keeps the two distinguishable later without a backfill. Existing rows are parses.
Metadata only (Directive 1): no payload column, no signal codes, no counts.

Image-rollback note: once a boot has stamped the DB at this revision, a container rolled back to
a pre-0005 image will crash-loop at startup (its alembic cannot resolve this revision id).
Recovery on the box:
    sqlite3 /data/audit.sqlite "ALTER TABLE audit_log DROP COLUMN endpoint;
        UPDATE alembic_version SET version_num = '0004_drop_api_keys_env';"
(i.e. this file's downgrade() plus re-stamping), or restore the nightly R2 backup.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0005_audit_endpoint"
down_revision: str | None = "0004_drop_api_keys_env"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("ALTER TABLE audit_log ADD COLUMN endpoint TEXT NOT NULL DEFAULT 'parse'")


def downgrade() -> None:
    op.execute("ALTER TABLE audit_log DROP COLUMN endpoint")
