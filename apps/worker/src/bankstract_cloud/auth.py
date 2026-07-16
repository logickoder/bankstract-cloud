# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hmac
import secrets
import sqlite3
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# API key format: bsk_<env>_<random32>  (env is "live" or "test").
# Stored hashed with argon2; the raw key is shown once on creation and never persisted.
# lookup_prefix narrows the candidate set without revealing the secret.

_PREFIX_LEN = 16
_RANDOM_BYTES = 24  # -> 32 url-safe chars

_hasher = PasswordHasher()


@dataclass(frozen=True)
class AuthContext:
    api_key_id: str
    tier: str  # "live" | "test" | "anonymous"
    owner: str | None = None  # apps/app user id; None for demo. Drives the subscription gate.

    @property
    def is_billable(self) -> bool:
        return self.tier == "live"

    @property
    def is_anonymous(self) -> bool:
        return self.tier == "anonymous"


@dataclass(frozen=True)
class IssuedKey:
    id: str
    raw_key: str
    lookup_prefix: str
    tier: str


@dataclass(frozen=True)
class KeyRecord:
    """Key metadata for listing. Never carries the raw key or its hash."""

    id: str
    name: str
    lookup_prefix: str
    env: str
    tier: str
    owner: str | None
    created_at: str
    revoked_at: str | None


def generate_api_key(env: str) -> tuple[str, str]:
    if env not in ("live", "test"):
        raise ValueError(f"env must be 'live' or 'test', got {env!r}")
    raw = f"bsk_{env}_{secrets.token_urlsafe(_RANDOM_BYTES)}"
    return raw, raw[:_PREFIX_LEN]


class KeyStore:
    """SQLite-backed API key store. The anonymous demo key is matched from config,
    never stored in the DB."""

    def __init__(self, conn: sqlite3.Connection, *, demo_api_key: str = "") -> None:
        self._conn = conn
        self._demo_api_key = demo_api_key

    def issue(self, name: str, env: str, *, owner: str | None = None) -> IssuedKey:
        raw, prefix = generate_api_key(env)
        key_id = uuid.uuid4().hex
        tier = "live" if env == "live" else "test"
        self._conn.execute(
            "INSERT INTO api_keys "
            "(id, name, lookup_prefix, key_hash, env, tier, owner, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                key_id,
                name,
                prefix,
                _hasher.hash(raw),
                env,
                tier,
                owner,
                datetime.now(UTC).isoformat(),
            ),
        )
        self._conn.commit()
        return IssuedKey(id=key_id, raw_key=raw, lookup_prefix=prefix, tier=tier)

    def list_keys(self, *, owner: str | None = None) -> list[KeyRecord]:
        sql = (
            "SELECT id, name, lookup_prefix, env, tier, owner, created_at, revoked_at FROM api_keys"
        )
        params: tuple[str, ...] = ()
        if owner is not None:
            sql += " WHERE owner = ?"
            params = (owner,)
        sql += " ORDER BY created_at DESC"
        rows = self._conn.execute(sql, params).fetchall()
        return [
            KeyRecord(
                id=r["id"],
                name=r["name"],
                lookup_prefix=r["lookup_prefix"],
                env=r["env"],
                tier=r["tier"],
                owner=r["owner"],
                created_at=r["created_at"],
                revoked_at=r["revoked_at"],
            )
            for r in rows
        ]

    def revoke(self, key_id: str) -> bool:
        # Soft delete: set revoked_at, never DELETE (keeps the audit trail). Returns
        # False if no active key matched, so the caller can 404.
        cur = self._conn.execute(
            "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
            (datetime.now(UTC).isoformat(), key_id),
        )
        self._conn.commit()
        return cur.rowcount > 0

    def active_test_key(self, owner: str) -> KeyRecord | None:
        row = self._conn.execute(
            "SELECT id, name, lookup_prefix, env, tier, owner, created_at, revoked_at "
            "FROM api_keys WHERE owner = ? AND tier = 'test' AND revoked_at IS NULL "
            "ORDER BY created_at DESC LIMIT 1",
            (owner,),
        ).fetchone()
        if row is None:
            return None
        return KeyRecord(
            id=row["id"],
            name=row["name"],
            lookup_prefix=row["lookup_prefix"],
            env=row["env"],
            tier=row["tier"],
            owner=row["owner"],
            created_at=row["created_at"],
            revoked_at=row["revoked_at"],
        )

    def roll_test_key(self, owner: str) -> IssuedKey:
        # One active test key per owner: revoke any existing active test key(s), then issue a fresh
        # one. Serves both provision (none -> one) and regenerate (one -> new), so the dashboard and
        # the signup auto-provision hit the same path.
        self._conn.execute(
            "UPDATE api_keys SET revoked_at = ? "
            "WHERE owner = ? AND tier = 'test' AND revoked_at IS NULL",
            (datetime.now(UTC).isoformat(), owner),
        )
        self._conn.commit()
        return self.issue("Test key", "test", owner=owner)

    def authenticate(self, raw_key: str) -> AuthContext | None:
        if self._demo_api_key and hmac.compare_digest(raw_key, self._demo_api_key):
            return AuthContext(api_key_id="demo", tier="anonymous")

        if not raw_key.startswith("bsk_"):
            return None

        prefix = raw_key[:_PREFIX_LEN]
        rows = self._conn.execute(
            "SELECT id, key_hash, tier, owner FROM api_keys "
            "WHERE lookup_prefix = ? AND revoked_at IS NULL",
            (prefix,),
        ).fetchall()
        for row in rows:
            try:
                _hasher.verify(row["key_hash"], raw_key)
            except VerifyMismatchError:
                continue
            return AuthContext(api_key_id=row["id"], tier=row["tier"], owner=row["owner"])
        return None
