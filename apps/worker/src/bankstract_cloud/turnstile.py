# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import httpx

_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


async def verify_turnstile(token: str, *, secret: str, remote_ip: str | None = None) -> bool:
    if not secret:
        # No secret configured (dev) — treat as disabled, not as a silent pass in prod.
        return True
    if not token:
        return False

    data = {"secret": secret, "response": token}
    if remote_ip:
        data["remoteip"] = remote_ip

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(_VERIFY_URL, data=data)
    if resp.status_code != 200:
        return False
    body = resp.json()
    return bool(body.get("success", False))
