# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""/v1 parse JSON is the engine's serialize() output; models.ParseResponse only documents it.
Round-tripping the engine JSON through the model must be lossless, so a field the engine adds,
drops, renames, or reformats fails here when the pin moves, before /v1 clients see it."""

from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal

import bankstract
import pytest
from bankstract import ParseResult, StatementMetadata

from bankstract_cloud.models import ParseResponse
from tests.conftest import txn

_METADATA = StatementMetadata(
    bank="fbn",
    account_holder="FOO BAR",
    account_number_masked="****1111",
    statement_period_start=datetime(2026, 1, 1),
    statement_period_end=datetime(2026, 1, 31),
    opening_balance=Decimal("100.00"),
    closing_balance=Decimal("600.00"),
)

# One result per reconciliation shape the engine can report.
_CASES = {
    "passed/passed": ParseResult(
        transactions=[txn("600.00", credit="500.00")],
        total_credit=Decimal("500.00"),
        total_debit=Decimal("0"),
        format_version="fbn-test",
        metadata=_METADATA,
    ),
    "not_available/passed": ParseResult(
        transactions=[txn("600.00", credit="500.00"), txn("550.00", debit="50.00")],
    ),
    "passed/not_available": ParseResult(
        transactions=[txn(None, credit="500.00")],
        total_credit=Decimal("500.00"),
        total_debit=Decimal("0"),
    ),
    # has_time=False: the padded 00:00:00 date (fbn, zenith), plus sparse metadata.
    "padded_time/sparse_metadata": ParseResult(
        transactions=[txn("600.00", credit="500.00", has_time=False, date=datetime(2026, 1, 5))],
        total_credit=Decimal("500.00"),
        total_debit=Decimal("0"),
        metadata=StatementMetadata(bank="zenith"),
    ),
    "passed/disabled": ParseResult(
        transactions=[txn("600.00", credit="500.00")],
        total_credit=Decimal("500.00"),
        total_debit=Decimal("0"),
        row_wise_disabled="ACME moves skip the running balance.",
    ),
}


@pytest.mark.parametrize("result", _CASES.values(), ids=_CASES.keys())
def test_engine_json_round_trips_through_parse_response(result: ParseResult) -> None:
    wire = json.loads(bankstract.serialize(bankstract.reconcile_result(result), "json"))
    assert ParseResponse.model_validate(wire).model_dump(mode="json") == wire
