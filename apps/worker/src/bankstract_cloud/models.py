# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, field_serializer

# The engine (bankstract 0.10.0) returns dataclasses (ParseResult, StatementMetadata)
# holding a pydantic Transaction. It exposes no model_dump. We define our own response
# contract here so the wire format is decoupled from engine internals across versions.
# Money is serialized as strings — Decimal precision must survive JSON (no float drift).


def _money(value: Decimal | None) -> str | None:
    return None if value is None else format(value, "f")


class TransactionOut(BaseModel):
    date: datetime
    narration: str
    debit: Decimal
    credit: Decimal
    balance: Decimal | None
    reference: str | None
    currency: str

    @field_serializer("debit", "credit", "balance", when_used="json")
    def _ser_money(self, value: Decimal | None) -> str | None:
        return _money(value)


class StatementMetadataOut(BaseModel):
    bank: str | None
    account_holder: str | None
    account_number_masked: str | None
    statement_period_start: datetime | None
    statement_period_end: datetime | None
    opening_balance: Decimal | None
    closing_balance: Decimal | None

    @field_serializer("opening_balance", "closing_balance", when_used="json")
    def _ser_money(self, value: Decimal | None) -> str | None:
        return _money(value)


class TotalsOut(BaseModel):
    credit: Decimal | None
    debit: Decimal | None

    @field_serializer("credit", "debit", when_used="json")
    def _ser_money(self, value: Decimal | None) -> str | None:
        return _money(value)


class ParseResponse(BaseModel):
    format_version: str | None
    metadata: StatementMetadataOut | None
    totals: TotalsOut
    row_wise_reconcilable: bool
    transactions: list[TransactionOut]


class ErrorResponse(BaseModel):
    error: str
    error_class: str
    format_version: str | None = None


class BankInfo(BaseModel):
    id: str


class BanksResponse(BaseModel):
    banks: list[BankInfo]
    engine_version: str


class UsageResponse(BaseModel):
    api_key_id: str
    period_parses: int
    projected_invoice_usd: str


class StatusResponse(BaseModel):
    status: Literal["ok"]
    worker_version: str
    engine_version: str


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ReadyResponse(BaseModel):
    status: Literal["ok", "degraded"]
    engine: bool
    database: bool
