# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hashlib
import hmac
import logging
from typing import Any, cast

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

    async def init_subscription(
        self, *, email: str, plan_code: str, owner: str, callback_url: str | None = None
    ) -> dict[str, str]:
        # Initialize a transaction bound to a plan. On a successful charge Paystack creates
        # the subscription and fires subscription.create; metadata.owner rides charge.success
        # so the webhook can map customer_code -> owner. callback_url is where Paystack sends
        # the user after payment. Returns inline-checkout params.
        # amount=0 lets the plan's own amount take precedence; omitting it entirely can trigger
        # "Invalid Amount Sent" on some Paystack plan configurations.
        payload: dict[str, Any] = {
            "email": email,
            "plan": plan_code,
            "amount": 0,
            "metadata": {"owner": owner},
        }
        if callback_url:
            payload["callback_url"] = callback_url
        data = await self._post("/transaction/initialize", payload)
        d = data["data"]
        return {
            "authorization_url": str(d["authorization_url"]),
            "access_code": str(d["access_code"]),
            "reference": str(d["reference"]),
        }

    async def disable_subscription(self, subscription_code: str) -> None:
        # Cancel a live subscription (account erasure). Paystack's /subscription/disable needs the
        # subscription code AND its email_token, which we don't store, so fetch it first. Raises
        # PaystackError on failure so the caller can abort the delete rather than orphan a charge.
        data = await self._get(f"/subscription/{subscription_code}")
        sub = data.get("data", {})
        # Idempotent: only active/attention subscriptions can be (and need to be) disabled.
        # A cancelled/non-renewing/completed one is already off; disabling it would error.
        if sub.get("status") not in {"active", "attention"}:
            return
        token = sub.get("email_token")
        if not token:
            raise PaystackError(f"no email_token for subscription {subscription_code}")
        await self._post(
            "/subscription/disable",
            {"code": subscription_code, "token": str(token)},
        )

    async def create_invoice(
        self, *, customer_code: str, amount_kobo: int, description: str
    ) -> str:
        # Overage billed via a Paystack payment request (invoice). Amount in kobo.
        data = await self._post(
            "/paymentrequest",
            {"customer": customer_code, "amount": amount_kobo, "description": description},
        )
        return str(data["data"]["request_code"])

    @staticmethod
    def _error_detail(resp: httpx.Response) -> str:
        # The Paystack message field only (never the full body; may carry card details). Guards a
        # non-object JSON error body (array/scalar), which would make .get() raise AttributeError.
        if "application/json" not in resp.headers.get("content-type", ""):
            return ""
        try:
            body: Any = resp.json()
        except ValueError:
            return ""
        if isinstance(body, dict):
            return str(cast("dict[str, Any]", body).get("message", ""))
        return ""

    async def _get(self, path: str) -> dict[str, Any]:
        return await self._request("GET", path)

    async def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", path, payload)

    async def _request(
        self, method: str, path: str, payload: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        if not self.enabled:
            raise PaystackError("paystack not configured")
        async with httpx.AsyncClient(timeout=15.0, base_url=_API_BASE) as client:
            resp = await client.request(method, path, json=payload, headers=self._headers())
        if resp.status_code >= 300:
            raise PaystackError(
                f"paystack {path} returned {resp.status_code}: {self._error_detail(resp)}"
            )
        body: dict[str, Any] = resp.json()
        return body

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._secret_key}",
            "Content-Type": "application/json",
        }
