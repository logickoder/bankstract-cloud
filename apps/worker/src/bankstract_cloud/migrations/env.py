# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from alembic import context
from sqlalchemy import create_engine

from bankstract_cloud.config import get_settings

# No ORM: migrations are hand-written op.* scripts, so there is no metadata to autogenerate
# against. render_as_batch is on so future column ALTERs work under SQLite.
config = context.config
target_metadata = None


def _url() -> str:
    # run_migrations() injects the exact DB path; the CLI fallback reads the worker settings.
    return config.get_main_option("sqlalchemy.url") or f"sqlite:///{get_settings().audit_db_path}"


def run_migrations_offline() -> None:
    context.configure(
        url=_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(_url())
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
