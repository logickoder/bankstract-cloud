# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio
import sqlite3
import uuid
from datetime import UTC, datetime

import pytest

from bankstract_cloud.audit import previous_period_bounds
from bankstract_cloud.billing_cron import OverageBillingResult, run_overage_billing
from bankstract_cloud.paystack import PaystackClient
from bankstract_cloud.state import AppState
from tests.conftest import Harness

# A fixed "now" in mid-June; the cycle that just closed is May 2026.
_ASOF = datetime(2026, 6, 15, 12, 0, 0, tzinfo=UTC)
_SINCE, _UNTIL = previous_period_bounds(_ASOF)  # "2026-05-01T..", "2026-06-01T.."
_IN_CYCLE = "2026-05-15T09:00:00+00:00"
_NEXT_CYCLE = "2026-06-02T09:00:00+00:00"


def _state(harness: Harness) -> AppState:
    return harness.client.app.state.app_state


def _setup_owner(state: AppState, owner: str, customer: str) -> str:
    # Map a Paystack customer and issue a live key; returns the key id for audit seeding.
    state.subscriptions.map_customer(owner=owner, customer_code=customer)
    return state.keystore.issue("prod", "live", owner=owner).id


def _seed_parses(state: AppState, api_key_id: str, *, n: int, timestamp: str) -> None:
    # Backdate audit rows directly: audit.record() always stamps now(), so a closed-cycle
    # fixture needs a raw insert. Separate connection; WAL makes the commit visible.
    conn = sqlite3.connect(state.settings.audit_db_path)
    try:
        for _ in range(n):
            conn.execute(
                "INSERT INTO audit_log (id, timestamp, api_key_id, filename, byte_count, "
                "parser_detected, success, error_class) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (uuid.uuid4().hex, timestamp, api_key_id, "s.pdf", 10, "fbn", 1, None),
            )
        conn.commit()
    finally:
        conn.close()


def _run(harness: Harness) -> list[OverageBillingResult]:
    return asyncio.run(run_overage_billing(_state(harness), asof=_ASOF))


def _patch_invoice(monkeypatch: pytest.MonkeyPatch, sink: list[int]) -> None:
    async def fake_invoice(
        self: object, *, customer_code: str, amount_kobo: int, description: str
    ) -> str:
        sink.append(amount_kobo)
        return "PRQ_test"

    monkeypatch.setattr("bankstract_cloud.paystack.PaystackClient.create_invoice", fake_invoice)


def test_bills_closed_cycle_overage(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    state = _state(harness)
    key_id = _setup_owner(state, "owner_ov", "CUS_ov")
    # Frozen snapshot for the closed cycle: small cap so seeding stays cheap.
    state.cycle_tiers.snapshot(
        owner="owner_ov", period_start=_SINCE, tier="starter", monthly_cap=2, overage_kobo=1_500
    )
    _seed_parses(state, key_id, n=5, timestamp=_IN_CYCLE)
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)

    results = _run(harness)

    # (5 - 2) * 1500 = 4500 kobo.
    assert charged == [4_500]
    assert len(results) == 1
    assert results[0].overage_parses == 3
    assert results[0].request_code == "PRQ_test"


def test_rerun_is_idempotent(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    state = _state(harness)
    key_id = _setup_owner(state, "owner_idem", "CUS_idem")
    state.cycle_tiers.snapshot(
        owner="owner_idem", period_start=_SINCE, tier="starter", monthly_cap=2, overage_kobo=1_500
    )
    _seed_parses(state, key_id, n=5, timestamp=_IN_CYCLE)
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)

    assert len(_run(harness)) == 1
    # Second run for the same cycle settles nothing: no second invoice.
    assert _run(harness) == []
    assert charged == [4_500]


def test_under_cap_records_no_invoice(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    state = _state(harness)
    key_id = _setup_owner(state, "owner_under", "CUS_under")
    state.cycle_tiers.snapshot(
        owner="owner_under",
        period_start=_SINCE,
        tier="starter",
        monthly_cap=100,
        overage_kobo=1_500,
    )
    _seed_parses(state, key_id, n=3, timestamp=_IN_CYCLE)
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)

    assert _run(harness) == []
    assert charged == []
    # Cycle is recorded as settled so the next tick does not recompute it.
    assert state.overage_ledger.already_billed("owner_under", _SINCE)


def test_next_cycle_parses_excluded(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    state = _state(harness)
    key_id = _setup_owner(state, "owner_bound", "CUS_bound")
    state.cycle_tiers.snapshot(
        owner="owner_bound", period_start=_SINCE, tier="starter", monthly_cap=2, overage_kobo=1_500
    )
    _seed_parses(state, key_id, n=5, timestamp=_IN_CYCLE)
    _seed_parses(state, key_id, n=10, timestamp=_NEXT_CYCLE)  # must NOT count
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)

    _run(harness)
    # Only the 5 May parses bill: (5 - 2) * 1500. June parses excluded by the upper bound.
    assert charged == [4_500]


def test_snapshot_tier_wins_over_live_tier(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Boundary downgrade: the closed cycle was "scale" (frozen), the owner is now "starter".
    # Billing must use the frozen numbers, not the live ones.
    state = _state(harness)
    key_id = _setup_owner(state, "owner_dg", "CUS_dg")
    state.subscriptions.activate(
        customer_code="CUS_dg",
        subscription_code=None,
        plan_code=None,
        tier="starter",  # live tier now
        current_period_end=None,
    )
    # Frozen May economics: a distinct cap + price that match no live TIERS row.
    state.cycle_tiers.snapshot(
        owner="owner_dg", period_start=_SINCE, tier="scale", monthly_cap=10, overage_kobo=500
    )
    _seed_parses(state, key_id, n=15, timestamp=_IN_CYCLE)
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)

    _run(harness)
    # Frozen: (15 - 10) * 500 = 2500. Live starter (cap 1000) would have billed 0.
    assert charged == [2_500]


def test_no_snapshot_no_billing(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    # Owner had parses but no cycle_tiers row for the closed cycle (e.g. worker down all month):
    # nothing to bill against, so nothing is billed.
    state = _state(harness)
    key_id = _setup_owner(state, "owner_nosnap", "CUS_nosnap")
    _seed_parses(state, key_id, n=50, timestamp=_IN_CYCLE)
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)

    assert _run(harness) == []
    assert charged == []


def test_disabled_paystack_is_noop(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    state = _state(harness)
    key_id = _setup_owner(state, "owner_off", "CUS_off")
    state.cycle_tiers.snapshot(
        owner="owner_off", period_start=_SINCE, tier="starter", monthly_cap=2, overage_kobo=1_500
    )
    _seed_parses(state, key_id, n=5, timestamp=_IN_CYCLE)
    charged: list[int] = []
    _patch_invoice(monkeypatch, charged)
    # Swap in an unconfigured client: no secret => no charges (Directive 6).
    state.paystack = PaystackClient(secret_key="")

    assert _run(harness) == []
    assert charged == []
    assert not state.overage_ledger.already_billed("owner_off", _SINCE)
