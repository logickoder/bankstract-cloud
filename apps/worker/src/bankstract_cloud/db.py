# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import sqlite3
from collections.abc import Generator
from contextlib import contextmanager

# Audit, API keys, and rate-limit counters share one SQLite file. NONE of these
# tables hold PDF payload data (Directive 1) — metadata and auth material only.

_SCHEMA = """
CREATE TABLE IF NOT EXISTS api_keys (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    lookup_prefix TEXT NOT NULL,
    key_hash      TEXT NOT NULL,
    env           TEXT NOT NULL,
    tier          TEXT NOT NULL,
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
    conn.executescript(_SCHEMA)
    conn.commit()


@contextmanager
def transaction(conn: sqlite3.Connection) -> Generator[sqlite3.Connection, None, None]:
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
