# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Any

import httpx

logger = logging.getLogger("bankstract_cloud.paystack")

_API_BASE = "https://api.paystack.co"


class PaystackError(Exception):
    """A Paystack API call failed. Surfaced to the caller as 402/502 per context."""


class PaystackClient:
    """Thin async wrapper over the Paystack REST API. Holds the secret key (worker-only;
    apps/app never sees it). Empty secret => disabled: no network, no fake charges."""

    def __init__(self, *, secret_key: str) -> None:
        self._secret_key = secret_key

    @property
    def enabled(self) -> bool:
        return bool(self._secret_key)

    def verify_webhook(self, body: bytes, signature: str | None) -> bool:
        # Paystack signs the raw request body with HMAC-SHA512 keyed by the secret key and
        # sends the hex digest in x-paystack-signature. Constant-time compare.
        if not self._secret_key or not signature:
            return False
        digest = hmac.new(self._secret_key.encode(), body, hashlib.sha512).hexdigest()
        return hmac.compare_digest(digest, signature)

    async def init_subscription(self, *, email: str, plan_code: str, owner: str) -> dict[str, str]:
        # Initialize a transaction bound to a plan. On a successful charge Paystack creates
        # the subscription and fires subscription.create; metadata.owner rides charge.success
        # so the webhook can map customer_code -> owner. Returns inline-checkout params.
        data = await self._post(
            "/transaction/initialize",
            {"email": email, "plan": plan_code, "metadata": {"owner": owner}},
        )
        d = data["data"]
        return {
            "authorization_url": str(d["authorization_url"]),
            "access_code": str(d["access_code"]),
            "reference": str(d["reference"]),
        }

    async def create_invoice(
        self, *, customer_code: str, amount_kobo: int, description: str
    ) -> str:
        # Overage billed via a Paystack payment request (invoice). Amount in kobo.
        data = await self._post(
            "/paymentrequest",
            {"customer": customer_code, "amount": amount_kobo, "description": description},
        )
        return str(data["data"]["request_code"])

    async def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.enabled:
            raise PaystackError("paystack not configured")
        async with httpx.AsyncClient(timeout=15.0, base_url=_API_BASE) as client:
            resp = await client.post(path, json=payload, headers=self._headers())
        if resp.status_code >= 300:
            # Body may carry card/account details we do not want in logs; log status only.
            raise PaystackError(f"paystack {path} returned {resp.status_code}")
        body: dict[str, Any] = resp.json()
        return body

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._secret_key}",
            "Content-Type": "application/json",
        }
