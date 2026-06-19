# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import logging

logger = logging.getLogger("bankstract_cloud.billing")

# Bill on success only (PRD risk table). One successful parse from a live key =
# one metered usage event. Parse errors are never billed — the caller only invokes
# record_parse() after a 200. Customer<->api_key mapping is owned by apps/app; the
# worker emits the usage signal keyed by api_key_id.

_PRICE_PER_PARSE_USD = "0.10"


class BillingError(Exception):
    """Stripe declined or the billing call failed. Maps to HTTP 402."""


class BillingClient:
    def __init__(self, *, secret_key: str, meter_event_name: str) -> None:
        self._enabled = bool(secret_key)
        self._secret_key = secret_key
        self._meter_event_name = meter_event_name

    @property
    def enabled(self) -> bool:
        return self._enabled

    def record_parse(self, api_key_id: str) -> None:
        if not self._enabled:
            logger.info("billing disabled: would record parse for key %s", api_key_id)
            return

        import stripe

        stripe.api_key = self._secret_key
        try:
            stripe.billing.MeterEvent.create(
                event_name=self._meter_event_name,
                payload={"value": "1", "api_key_id": api_key_id},
            )
        except Exception as exc:  # surface any Stripe failure as 402
            raise BillingError(str(exc)) from exc

    @staticmethod
    def price_per_parse_usd() -> str:
        return _PRICE_PER_PARSE_USD
