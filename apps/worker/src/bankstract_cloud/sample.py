# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""Canned free-tier sample. Served instead of a real parse once a free surface (demo per-IP, test
per-owner) is over its cap. It is a FIXED synthetic statement, NOT a parse of the caller's upload:
no upload is parsed (no RAM cost) and no real data leaves memory. The `_sample` marker keeps it
honest (a client can tell it is not their parse) and the fixed shape keeps their integration code
alive.

Synthetic data only (fixture rule): FOO / BAR / ACME, masked account, round amounts."""

from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal

import bankstract
from bankstract import ParseResult, StatementMetadata, Transaction

_UPGRADE_URL = "https://bankstract.logickoder.dev/pricing"
_SAMPLE_REASON = "Free tier limit reached. This is sample data, not a parse of your file."

# Built once at import from engine types and run through the same reconcile + serialize as a real
# parse, so the sample's JSON and CSV shapes cannot drift from live output (or from each other).
_STATEMENT = bankstract.reconcile_result(
    ParseResult(
        format_version="sample-1",
        metadata=StatementMetadata(
            bank="fbn",
            account_holder="FOO BAR",
            account_number_masked="****1234",
            statement_period_start=datetime(2026, 6, 1),
            statement_period_end=datetime(2026, 6, 30),
            opening_balance=Decimal("1000.00"),
            closing_balance=Decimal("1210.00"),
        ),
        total_credit=Decimal("250.00"),
        total_debit=Decimal("40.00"),
        transactions=[
            Transaction(
                date=datetime(2026, 6, 1),
                narration="Transfer from FOO",
                credit=Decimal("250.00"),
                balance=Decimal("1250.00"),
                reference="REF001",
            ),
            Transaction(
                date=datetime(2026, 6, 2),
                narration="POS ACME STORES",
                debit=Decimal("40.00"),
                balance=Decimal("1210.00"),
                reference="REF002",
            ),
        ],
    )
)

_SAMPLE_JSON: dict[str, object] = json.loads(bankstract.serialize(_STATEMENT, "json"))

# `#` is the de facto CSV comment prefix (pandas read_csv(comment='#') skips it).
_SAMPLE_CSV = (
    "# bankstract free tier limit reached. This is sample data, not a parse of your file.\n"
    f"# Upgrade for real parses: {_UPGRADE_URL}\n"
).encode() + bankstract.serialize(_STATEMENT, "csv")


def sample_json_payload() -> dict[str, object]:
    return {
        "_sample": {"reason": _SAMPLE_REASON, "upgrade_url": _UPGRADE_URL},
        **_SAMPLE_JSON,
    }


def sample_csv() -> bytes:
    return _SAMPLE_CSV
