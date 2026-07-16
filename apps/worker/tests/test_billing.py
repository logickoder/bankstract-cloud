# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import hashlib
import hmac
import json
from typing import Any

import httpx
import pytest

from bankstract_cloud.audit import AuditEntry
from bankstract_cloud.usage import OverageReport, compute_overage, kobo_to_naira_str
from tests.conftest import Harness, auth_header, pdf_upload


def _sign(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()


def _webhook(harness: Harness, event: dict[str, Any]) -> httpx.Response:
    body = json.dumps(event).encode()
    headers = {"x-paystack-signature": _sign(harness.paystack_secret, body)}
    return harness.client.post("/v1/billing/webhook", content=body, headers=headers)


def _status(harness: Harness, owner: str) -> dict[str, Any]:
    res = harness.client.get(
        "/v1/admin/billing/status",
        params={"owner": owner},
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 200
    return res.json()


def _charge(owner: str, customer: str, event_id: int = 1) -> dict[str, Any]:
    return {
        "event": "charge.success",
        "data": {
            "id": event_id,
            "customer": {"customer_code": customer},
            "metadata": {"owner": owner},
        },
    }


def _customer_event(event: str, customer: str, event_id: int) -> dict[str, Any]:
    return {"event": event, "data": {"id": event_id, "customer": {"customer_code": customer}}}


def _sub_create(customer: str, plan: str, event_id: int = 2) -> dict[str, Any]:
    return {
        "event": "subscription.create",
        "data": {
            "id": event_id,
            "customer": {"customer_code": customer},
            "plan": {"plan_code": plan},
            "subscription_code": "SUB_test",
            "next_payment_date": "2026-07-01T00:00:00Z",
        },
    }


def test_webhook_rejects_bad_signature(harness: Harness) -> None:
    res = harness.client.post(
        "/v1/billing/webhook",
        content=b'{"event":"charge.success"}',
        headers={"x-paystack-signature": "deadbeef"},
    )
    assert res.status_code == 401


def test_webhook_rejects_missing_signature(harness: Harness) -> None:
    res = harness.client.post("/v1/billing/webhook", content=b"{}")
    assert res.status_code == 401


def test_subscription_lifecycle(harness: Harness) -> None:
    owner, customer = "user_1", "CUS_abc"

    # Unknown owner before any event.
    assert _status(harness, owner)["status"] == "none"

    # charge.success maps customer -> owner but does not activate on its own.
    assert _webhook(harness, _charge(owner, customer)).status_code == 200
    assert _status(harness, owner)["status"] == "inactive"

    # subscription.create flips active and records the tier from the plan code.
    assert _webhook(harness, _sub_create(customer, "PLN_starter_test")).status_code == 200
    active = _status(harness, owner)
    assert active["status"] == "active"
    assert active["tier"] == "starter"
    assert active["current_period_end"] == "2026-07-01T00:00:00Z"

    # subscription.disable deactivates immediately (no grace).
    disabled = _customer_event("subscription.disable", customer, 3)
    assert _webhook(harness, disabled).status_code == 200
    assert _status(harness, owner)["status"] == "inactive"


def test_subscription_create_before_charge_success_still_activates(harness: Harness) -> None:
    # Paystack does not guarantee webhook order. If subscription.create lands before the
    # charge.success that maps owner <-> customer, the activation is parked and applied once the
    # mapping arrives. Without reconciliation the UPDATE would hit 0 rows and the sub stays dead.
    owner, customer = "user_race", "CUS_race"

    assert _webhook(harness, _sub_create(customer, "PLN_starter_test")).status_code == 200
    assert _status(harness, owner)["status"] == "none"  # no owner row yet

    assert _webhook(harness, _charge(owner, customer)).status_code == 200
    reconciled = _status(harness, owner)
    assert reconciled["status"] == "active"
    assert reconciled["tier"] == "starter"


def test_disable_before_mapping_does_not_resurrect(harness: Harness) -> None:
    # A parked activation must not survive a disable: if create then disable both arrive before
    # charge.success, the later mapping must land inactive, not active.
    owner, customer = "user_race2", "CUS_race2"
    _webhook(harness, _sub_create(customer, "PLN_starter_test", event_id=51))
    _webhook(harness, _customer_event("subscription.disable", customer, 52))
    _webhook(harness, _charge(owner, customer, event_id=53))
    assert _status(harness, owner)["status"] == "inactive"


def test_payment_failed_deactivates(harness: Harness) -> None:
    owner, customer = "user_pf", "CUS_pf"
    _webhook(harness, _charge(owner, customer))
    _webhook(harness, _sub_create(customer, "PLN_starter_test"))
    assert _status(harness, owner)["status"] == "active"

    failed = _customer_event("invoice.payment_failed", customer, 7)
    assert _webhook(harness, failed).status_code == 200
    assert _status(harness, owner)["status"] == "inactive"


def test_webhook_dedup_blocks_reprocessing(harness: Harness) -> None:
    owner, customer = "user_dd", "CUS_dd"
    _webhook(harness, _charge(owner, customer))
    _webhook(harness, _sub_create(customer, "PLN_starter_test", event_id=42))
    assert _status(harness, owner)["status"] == "active"

    # Disable, then replay the SAME create id (42). Dedup must drop the replay, so the
    # subscription stays inactive rather than resurrecting.
    _webhook(harness, _customer_event("subscription.disable", customer, 9))
    assert _status(harness, owner)["status"] == "inactive"
    replay = _sub_create(customer, "PLN_starter_test", event_id=42)
    assert _webhook(harness, replay).status_code == 200
    assert _status(harness, owner)["status"] == "inactive"


def test_status_requires_admin(harness: Harness) -> None:
    res = harness.client.get("/v1/admin/billing/status", params={"owner": "x"})
    assert res.status_code == 401


def test_subscribe_initializes_checkout(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_init(
        self: Any, *, email: str, plan_code: str, owner: str, callback_url: str | None = None
    ) -> dict[str, str]:
        assert plan_code == "PLN_starter_test"
        assert owner == "user_sub"
        assert callback_url == "https://app.test/dashboard/billing"
        return {
            "authorization_url": "https://paystack.test/checkout",
            "access_code": "acc_1",
            "reference": "ref_1",
        }

    monkeypatch.setattr("bankstract_cloud.paystack.PaystackClient.init_subscription", fake_init)
    res = harness.client.post(
        "/v1/admin/billing/subscribe",
        json={
            "owner": "user_sub",
            "email": "dev@acme.test",
            "tier": "starter",
            "callback_url": "https://app.test/dashboard/billing",
        },
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 200
    assert res.json()["reference"] == "ref_1"


def test_subscribe_annual_uses_annual_plan(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def fake_init(
        self: Any, *, email: str, plan_code: str, owner: str, callback_url: str | None = None
    ) -> dict[str, str]:
        assert plan_code == "PLN_starter_annual_test"
        return {"authorization_url": "u", "access_code": "a", "reference": "r"}

    monkeypatch.setattr("bankstract_cloud.paystack.PaystackClient.init_subscription", fake_init)
    res = harness.client.post(
        "/v1/admin/billing/subscribe",
        json={"owner": "u", "email": "u@e.test", "tier": "starter", "interval": "annual"},
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 200


def test_annual_plan_webhook_maps_to_tier(harness: Harness) -> None:
    # A subscription.create carrying the annual plan code must still resolve to the tier.
    owner, customer = "user_annual", "CUS_annual"
    _webhook(harness, _charge(owner, customer))
    _webhook(harness, _sub_create(customer, "PLN_starter_annual_test"))
    status = _status(harness, owner)
    assert status["status"] == "active"
    assert status["tier"] == "starter"


def test_subscribe_unconfigured_annual_503(harness: Harness) -> None:
    # The Scale annual plan code is unset in the test env -> interval not configured.
    res = harness.client.post(
        "/v1/admin/billing/subscribe",
        json={"owner": "u", "email": "u@e.test", "tier": "scale", "interval": "annual"},
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 503


def test_live_key_requires_active_subscription(harness: Harness) -> None:
    issued = harness.client.app.state.app_state.keystore.issue("prod", "live", owner="owner_live")

    # No subscription: 402 subscription_inactive, returned before any PDF byte is read.
    res = harness.client.post("/v1/parse", headers=auth_header(issued.raw_key), files=pdf_upload())
    assert res.status_code == 402
    assert res.json()["error_class"] == "subscription_inactive"

    # Activate via webhooks; the same key now clears the gate (no longer 402).
    _webhook(harness, _charge("owner_live", "CUS_live"))
    _webhook(harness, _sub_create("CUS_live", "PLN_starter_test"))
    cleared = harness.client.post(
        "/v1/parse", headers=auth_header(issued.raw_key), files=pdf_upload()
    )
    assert cleared.status_code != 402


def test_subscribe_requires_admin(harness: Harness) -> None:
    res = harness.client.post(
        "/v1/admin/billing/subscribe",
        json={"owner": "u", "email": "u@e.test", "tier": "starter"},
    )
    assert res.status_code == 401


def test_subscribe_unconfigured_tier_503(harness: Harness) -> None:
    # Growth/Scale plan codes are unset in the test env -> tier not configured.
    res = harness.client.post(
        "/v1/admin/billing/subscribe",
        json={"owner": "u", "email": "u@e.test", "tier": "growth"},
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 503


def test_compute_overage_math() -> None:
    # Within cap: no overage.
    under = compute_overage(tier="starter", period_parses=900)
    assert under.overage_parses == 0
    assert under.overage_amount_kobo == 0
    assert under.monthly_cap == 1_000

    # Over cap: 500 * ₦15 = ₦7,500 = 750,000 kobo.
    over = compute_overage(tier="starter", period_parses=1_500)
    assert over.overage_parses == 500
    assert over.overage_amount_kobo == 750_000
    assert kobo_to_naira_str(over.overage_amount_kobo) == "7500.00"

    # No tier (test key / no subscription): no cap, no overage.
    none = compute_overage(tier=None, period_parses=10_000)
    assert none.monthly_cap is None
    assert none.overage_parses == 0


def test_kobo_to_naira_str_is_exact() -> None:
    assert kobo_to_naira_str(0) == "0.00"
    assert kobo_to_naira_str(153_050) == "1530.50"
    assert kobo_to_naira_str(5) == "0.05"


def _record_success(harness: Harness, key_id: str, n: int) -> None:
    audit = harness.client.app.state.app_state.audit
    for i in range(n):
        audit.record(
            AuditEntry(
                api_key_id=key_id,
                filename=f"s{i}.pdf",
                byte_count=10,
                parser_detected="fbn",
                success=True,
                error_class=None,
            )
        )


def test_usage_reports_tier_cap_and_overage(harness: Harness) -> None:
    owner, customer = "owner_usage", "CUS_usage"
    issued = harness.client.app.state.app_state.keystore.issue("prod", "live", owner=owner)
    _webhook(harness, _charge(owner, customer))
    _webhook(harness, _sub_create(customer, "PLN_starter_test"))
    _record_success(harness, issued.id, 3)

    body = harness.client.get("/v1/usage", headers=auth_header(issued.raw_key)).json()
    assert body["tier"] == "starter"
    assert body["period_parses"] == 3
    assert body["monthly_cap"] == 1_000
    assert body["overage_parses"] == 0
    assert body["projected_overage_naira"] == "0.00"


def test_charge_overage_nothing_to_bill(harness: Harness) -> None:
    owner, customer = "owner_noov", "CUS_noov"
    _webhook(harness, _charge(owner, customer))
    _webhook(harness, _sub_create(customer, "PLN_starter_test"))
    res = harness.client.post(
        "/v1/admin/billing/charge-overage",
        params={"owner": owner},
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 200
    assert res.json()["request_code"] is None
    assert res.json()["overage_parses"] == 0


def test_charge_overage_creates_invoice(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    owner, customer = "owner_ov", "CUS_ov"
    _webhook(harness, _charge(owner, customer))
    _webhook(harness, _sub_create(customer, "PLN_starter_test"))

    def fake_overage(
        audit: object, subscriptions: object, owner: str, *, since_iso: str
    ) -> OverageReport:
        return OverageReport(
            tier="starter",
            monthly_cap=1_000,
            period_parses=1_500,
            overage_parses=500,
            overage_amount_kobo=750_000,
        )

    monkeypatch.setattr("bankstract_cloud.routes.billing.overage_report_for_owner", fake_overage)

    async def fake_invoice(
        self: object, *, customer_code: str, amount_kobo: int, description: str
    ) -> str:
        assert customer_code == customer
        assert amount_kobo == 750_000
        return "PRQ_test"

    monkeypatch.setattr("bankstract_cloud.paystack.PaystackClient.create_invoice", fake_invoice)
    res = harness.client.post(
        "/v1/admin/billing/charge-overage",
        params={"owner": owner},
        headers=auth_header(harness.admin_token),
    )
    assert res.status_code == 200
    assert res.json()["request_code"] == "PRQ_test"
    assert res.json()["overage_parses"] == 500


def test_charge_overage_requires_admin(harness: Harness) -> None:
    res = harness.client.post("/v1/admin/billing/charge-overage", params={"owner": "x"})
    assert res.status_code == 401
