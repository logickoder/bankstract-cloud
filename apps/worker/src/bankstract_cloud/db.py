# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3

# Audit, API keys, and rate-limit counters share one SQLite file. NONE of these
# tables hold PDF payload data (Directive 1). Metadata and auth material only.

_SCHEMA = """
CREATE TABLE IF NOT EXISTS api_keys (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    lookup_prefix TEXT NOT NULL,
    key_hash      TEXT NOT NULL,
    env           TEXT NOT NULL,
    tier          TEXT NOT NULL,
    owner         TEXT,
    created_at    TEXT NOT NULL,
    revoked_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_api_keys_lookup ON api_keys(lookup_prefix);

CREATE TABLE IF NOT EXISTS audit_log (
    id              TEXT PRIMARY KEY,
    timestamp       TEXT NOT NULL,
    api_key_id      TEXT NOT NULL,
    filename        TEXT,
    byte_count      INTEGER NOT NULL,
    parser_detected TEXT,
    success         INTEGER NOT NULL,
    error_class     TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_key_time ON audit_log(api_key_id, timestamp);

CREATE TABLE IF NOT EXISTS rate_limit (
    bucket       TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count        INTEGER NOT NULL,
    PRIMARY KEY (bucket, window_start)
);
"""


def connect(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    # Order matters: create tables → migrate columns → create indexes that depend on
    # migrated columns. CREATE TABLE IF NOT EXISTS is a no-op on an existing table, so
    # the `owner` column only arrives via _migrate, and its index must come after.
    conn.executescript(_SCHEMA)
    _migrate(conn)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner)")
    conn.commit()


def _migrate(conn: sqlite3.Connection) -> None:
    # ALPHA-ONLY scaffolding: bridges an existing dev DB to a new column without losing it.
    # No production data yet, so this whole function is deletable once DBs are reset before
    # launch (the column already lives in CREATE TABLE). Post-launch, real migrations move
    # to a proper tool (Alembic). See _local/LEARNING § 10.
    # Idempotent: on a fresh DB the column exists from CREATE TABLE above, so this no-ops.
    cols = {row["name"] for row in conn.execute("PRAGMA table_info(api_keys)")}
    if "owner" not in cols:
        conn.execute("ALTER TABLE api_keys ADD COLUMN owner TEXT")
