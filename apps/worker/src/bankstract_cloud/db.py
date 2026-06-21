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
    command.upgrade(cfg, "head")
