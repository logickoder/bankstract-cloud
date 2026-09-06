# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hashlib
import hmac
import sqlite3
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, Request

from .audit import AuditLog
from .auth import AuthContext, KeyStore
from .config import Settings
from .jobs import JobStore
from .overage_ledger import CycleTierStore, OverageLedger
from .paystack import PaystackClient
from .rate_limit import RateLimiter
from .subscriptions import SubscriptionStore


@dataclass
class AppState:
    settings: Settings
    keystore: KeyStore
    audit: AuditLog
    rate_limiter: RateLimiter
    paystack: PaystackClient
    subscriptions: SubscriptionStore
    cycle_tiers: CycleTierStore
    overage_ledger: OverageLedger
    jobs: JobStore
    # The shared SQLite connection, exposed for cross-table operations (e.g. owner erasure).
    conn: sqlite3.Connection


def get_state(request: Request) -> AppState:
    state = getattr(request.app.state, "app_state", None)
    if state is None:  # pragma: no cover - only if accessed outside lifespan
        raise HTTPException(status_code=503, detail="worker not ready")
    return state


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return authorization.removeprefix("Bearer ").strip()


def require_auth(
    authorization: str | None = Header(default=None),
    state: AppState = Depends(get_state),
) -> AuthContext:
    raw_key = _bearer_token(authorization)
    if raw_key is None:
        raise HTTPException(status_code=401, detail="missing or malformed API key")
    ctx = state.keystore.authenticate(raw_key)
    if ctx is None:
        raise HTTPException(status_code=401, detail="invalid API key")
    return ctx


def require_admin(
    authorization: str | None = Header(default=None),
    state: AppState = Depends(get_state),
) -> None:
    # Gates key management. An empty configured token means the feature is OFF, so we must
    # never let "" match "" (that would let anyone mint keys). Constant-time compare
    # avoids leaking the token via response timing.
    token = state.settings.admin_api_token
    if not token:
        raise HTTPException(status_code=403, detail="key management is disabled")
    presented = _bearer_token(authorization)
    if presented is None:
        raise HTTPException(status_code=401, detail="missing admin token")
    if not hmac.compare_digest(presented, token):
        raise HTTPException(status_code=401, detail="invalid admin token")


def client_ip(request: Request) -> str:
    # The prod edge is a SINGLE trusted reverse proxy (Caddy), which appends the real peer to the
    # RIGHT of X-Forwarded-For. So the right-most hop is the trustworthy client IP; every entry to
    # its left is client-supplied and spoofable. We deliberately do NOT read cf-connecting-ip: the
    # box is Caddy-fronted, not Cloudflare-proxied, so that header is fully attacker-controlled.
    # (Trusting the left-most XFF hop or cf-connecting-ip would let a demo caller rotate the header
    # per request and mint unlimited rate-limit buckets, defeating the 50/month cap.)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def _hashed_ip_bucket(prefix: str, salt: str, ip: str) -> str:
    """Rate-limit bucket key from an IP. The raw IP never reaches storage: the key is a salted
    sha256 of it (Directive 1, data minimisation)."""
    digest = hashlib.sha256(f"{salt}:{ip}".encode()).hexdigest()
    return f"{prefix}:{digest[:32]}"


def demo_bucket(request: Request, salt: str) -> str:
    """Bucket for an anonymous demo visitor. Turnstile still gets the real IP for its own bot
    check; we just don't persist it."""
    return _hashed_ip_bucket("demo", salt, client_ip(request))


def first_party_bucket(request: Request, salt: str, key_id: str) -> str:
    """Per-end-user-IP bucket for a first-party surface, namespaced by key id so two surfaces
    never share windows.

    The surface's proxy forwards the real end-user IP in X-First-Party-Client-IP (our own
    network peer is only the proxy's egress IP, shared by every one of its users). Trusting a
    client-supplied header is safe ONLY because first_party keys are minted exclusively to
    surfaces we operate, which is why the header read lives inside this fp-namespaced builder
    and nowhere else. A missing header degrades to the proxy's shared egress-IP bucket: the
    surface rate-limits as one user, failing loud instead of silently unmetered."""
    forwarded = request.headers.get("x-first-party-client-ip")
    ip = forwarded.strip() if forwarded else client_ip(request)
    return _hashed_ip_bucket(f"fp:{key_id}", salt, ip)
