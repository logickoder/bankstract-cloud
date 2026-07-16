# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""Canned free-tier sample. Served instead of a real parse once a free surface (demo per-IP, test
per-owner) is over its cap. It is a FIXED synthetic statement, NOT a parse of the caller's upload:
the engine never runs (no RAM cost) and no real data leaves memory. The `_sample` marker keeps it
honest (a client can tell it is not their parse) and the fixed shape keeps their integration code
alive.

Synthetic data only (fixture rule): FOO / BAR / ACME, masked account, round amounts."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from .models import ParseResponse, StatementMetadataOut, TotalsOut, TransactionOut

_UPGRADE_URL = "https://bankstract.logickoder.dev/pricing"
_SAMPLE_REASON = "Free tier limit reached. This is sample data, not a parse of your file."

SAMPLE_RESPONSE = ParseResponse(
    format_version="sample-1",
    metadata=StatementMetadataOut(
        bank="fbn",
        account_holder="FOO BAR",
        account_number_masked="****1234",
        statement_period_start=datetime(2026, 6, 1, tzinfo=UTC),
        statement_period_end=datetime(2026, 6, 30, tzinfo=UTC),
        opening_balance=Decimal("1000.00"),
        closing_balance=Decimal("1210.00"),
    ),
    totals=TotalsOut(credit=Decimal("250.00"), debit=Decimal("40.00")),
    row_wise_reconcilable=True,
    transactions=[
        TransactionOut(
            date=datetime(2026, 6, 1, tzinfo=UTC),
            narration="Transfer from FOO",
            debit=Decimal("0.00"),
            credit=Decimal("250.00"),
            balance=Decimal("1250.00"),
            reference="REF001",
            currency="NGN",
        ),
        TransactionOut(
            date=datetime(2026, 6, 2, tzinfo=UTC),
            narration="POS ACME STORES",
            debit=Decimal("40.00"),
            credit=Decimal("0.00"),
            balance=Decimal("1210.00"),
            reference="REF002",
            currency="NGN",
        ),
    ],
)


def sample_json_payload() -> dict[str, object]:
    return {
        "_sample": {"reason": _SAMPLE_REASON, "upgrade_url": _UPGRADE_URL},
        **SAMPLE_RESPONSE.model_dump(mode="json"),
    }


def sample_csv() -> bytes:
    # `#` is the de facto CSV comment prefix (pandas read_csv(comment='#') skips it). The rows
    # below are synthetic, matching SAMPLE_RESPONSE.
    return (
        "# bankstract free tier limit reached. This is sample data, not a parse of your file.\n"
        f"# Upgrade for real parses: {_UPGRADE_URL}\n"
        "date,narration,debit,credit,balance,reference,currency\n"
        "2026-06-01,Transfer from FOO,0.00,250.00,1250.00,REF001,NGN\n"
        "2026-06-02,POS ACME STORES,40.00,0.00,1210.00,REF002,NGN\n"
    ).encode()
