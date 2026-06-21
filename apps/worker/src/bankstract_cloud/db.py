# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
from pathlib import Path

from alembic import command
from alembic.config import Config

# Audit, API keys, rate-limit counters, and subscription state share one SQLite file. NONE
# of these tables hold PDF payload data (Directive 1): metadata and auth material only.
# Schema is owned by Alembic (no ORM; hand-written migrations under migrations/), not by a
# CREATE-on-boot block.

_MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"
_BASELINE = "0001_baseline"
_BASELINE_TABLES = frozenset(
    {"api_keys", "audit_log", "rate_limit", "subscriptions", "webhook_events"}
)


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def run_migrations(db_path: str) -> None:
    # `upgrade head` is idempotent: it builds a fresh DB from the baseline and applies only
    # new revisions on an existing one. Runs at worker boot before the app opens its handle.
    cfg = Config()
    cfg.set_main_option("script_location", str(_MIGRATIONS_DIR))
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    _bridge_unversioned(db_path, cfg)
    command.upgrade(cfg, "head")


def _bridge_unversioned(db_path: str, cfg: Config) -> None:
    # A DB that predates Alembic (or whose first stamp half-completed) has the full schema
    # but no recorded revision. Re-running the baseline would `CREATE TABLE` over existing
    # tables and crash, so stamp it at the baseline instead. Only when the WHOLE baseline is
    # present: a fresh or partial DB is left for `upgrade` to build / fail loudly on.
    with sqlite3.connect(db_path) as conn:
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not tables >= _BASELINE_TABLES:
            return
        if "alembic_version" in tables:
            row = conn.execute("SELECT version_num FROM alembic_version LIMIT 1").fetchone()
            if row is not None:
                return  # already versioned: normal upgrade path
    command.stamp(cfg, _BASELINE)
