# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, PlainSerializer

# The engine (bankstract) returns dataclasses (ParseResult, StatementMetadata) holding a
# pydantic Transaction. It exposes no model_dump. We define our own response contract here
# so the wire format is decoupled from engine internals across versions.
# Money is serialized as strings — Decimal precision must survive JSON (no float drift).


def _money_str(value: Decimal) -> str:
    return format(value, "f")


def _money_opt(value: Decimal | None) -> str | None:
    return None if value is None else format(value, "f")


Money = Annotated[Decimal, PlainSerializer(_money_str, when_used="json")]
OptionalMoney = Annotated[Decimal | None, PlainSerializer(_money_opt, when_used="json")]


class TransactionOut(BaseModel):
    date: datetime
    narration: str
    debit: Money
    credit: Money
    balance: OptionalMoney
    reference: str | None
    currency: str


class StatementMetadataOut(BaseModel):
    bank: str | None
    account_holder: str | None
    account_number_masked: str | None
    statement_period_start: datetime | None
    statement_period_end: datetime | None
    opening_balance: OptionalMoney
    closing_balance: OptionalMoney


class TotalsOut(BaseModel):
    credit: OptionalMoney
    debit: OptionalMoney


class ParseResponse(BaseModel):
    format_version: str | None
    metadata: StatementMetadataOut | None
    totals: TotalsOut
    row_wise_reconcilable: bool
    transactions: list[TransactionOut]


class ErrorResponse(BaseModel):
    """Error envelope for all non-2xx responses. `error_class` is one of:

    - `EncryptedSourceError` — source is password-protected
    - `EmptyStatementError` — parsed clean, zero rows (see `marker_coverage`)
    - `LayoutDriftError` — bank detected, structure broke
    - `ReconciliationError` — totals don't match the statement
    - `ParseError` — last-resort parse failure
    - `AuthError` / `PayloadTooLarge` / `RateLimitError` / `ServiceUnavailable` /
      `WorkerError` — framework concerns

    `marker_coverage` is populated only for `EmptyStatementError`: high coverage with
    zero rows ≈ legitimately empty; lower coverage ≈ silent layout drift.
    """

    error: str
    error_class: str
    format_version: str | None = None
    marker_coverage: float | None = None


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
