# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hmac
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, Request

from .audit import AuditLog
from .auth import AuthContext, KeyStore
from .config import Settings
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
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
