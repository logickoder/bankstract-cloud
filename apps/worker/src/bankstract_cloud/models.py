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
# Money is serialized as strings. Decimal precision must survive JSON (no float drift).


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

    - `EncryptedSourceError`: source is password-protected
    - `EmptyStatementError`: parsed clean, zero rows (see `marker_coverage`)
    - `LayoutDriftError`: bank detected, structure broke
    - `ReconciliationError`: totals don't match the statement
    - `ParseError`: last-resort parse failure
    - `AuthError` / `PayloadTooLarge` / `RateLimitError` / `ServiceUnavailable` /
      `WorkerError`: framework concerns

    `marker_coverage` is populated only for `EmptyStatementError`: high coverage with
    zero rows ≈ legitimately empty; lower coverage ≈ silent layout drift.
    """

    error: str
    error_class: str
    format_version: str | None = None
    marker_coverage: float | None = None


class JobAccepted(BaseModel):
    """202 response from POST /v1/parse/jobs. Open the SSE `stream_url` for live progress, or fall
    back to polling `poll_url`."""

    job_id: str
    stream_url: str
    poll_url: str


class ProgressSnapshot(BaseModel):
    stage: str  # detect | open | extract_page | walk_page | reconcile | done (engine stage strings)
    current: int
    total: int


class JobSnapshot(BaseModel):
    """Poll fallback for an async parse job. For a `json` job, `result` is the ParseResponse once
    `done`. For `csv`/`redact`, the bytes are not inlined: fetch them from `result_url`. The error
    fields are populated once `failed`."""

    job_id: str
    state: Literal["queued", "running", "done", "failed"]
    result_kind: Literal["json", "csv", "redact"] = "json"
    progress: ProgressSnapshot | None = None
    result: ParseResponse | None = None  # json only
    result_url: str | None = None  # download URL for the bytes (csv/redact), present once done
    format_version: str | None = None
    redactions: int | None = None  # redact only
    error: str | None = None
    error_class: str | None = None


class BankInfo(BaseModel):
    id: str


class BanksResponse(BaseModel):
    banks: list[BankInfo]
    engine_version: str


class UsageResponse(BaseModel):
    api_key_id: str
    tier: str | None
    # Successful parses across the owner's keys this cycle (failures never count).
    period_parses: int
    monthly_cap: int | None
    overage_parses: int
    # Projected overage in NGN, exact 2dp string (e.g. "1530.00"). "0.00" within cap.
    projected_overage_naira: str


class DailyCount(BaseModel):
    date: str
    count: int


class OwnerUsageResponse(BaseModel):
    owner: str
    tier: str | None
    period_parses: int
    success_rate: float
    monthly_cap: int | None
    overage_parses: int
    # Projected overage in NGN, exact 2dp string (e.g. "1530.00"). "0.00" within cap.
    projected_overage_naira: str
    daily: list[DailyCount]


class StatusResponse(BaseModel):
    status: Literal["ok"]
    worker_version: str
    engine_version: str


class KeyCreateRequest(BaseModel):
    name: str
    env: Literal["live", "test"] = "test"
    owner: str | None = None


class KeyCreatedResponse(BaseModel):
    """Returned once, on creation. The only time the raw key is ever exposed."""

    id: str
    key: str
    prefix: str
    name: str
    env: str
    tier: str


class KeyInfo(BaseModel):
    id: str
    name: str
    prefix: str
    env: str
    tier: str
    owner: str | None
    created_at: str
    revoked_at: str | None


class KeyListResponse(BaseModel):
    keys: list[KeyInfo]


class SubscribeRequest(BaseModel):
    owner: str
    email: str
    tier: Literal["starter", "growth", "scale"]
    interval: Literal["monthly", "annual"] = "monthly"
    # Where Paystack returns the user after payment (apps/app supplies its own URL).
    callback_url: str | None = None


class SubscribeResponse(BaseModel):
    # Paystack inline-checkout params for the client to complete payment.
    authorization_url: str
    access_code: str
    reference: str


class SubscriptionStatusResponse(BaseModel):
    owner: str
    tier: str | None
    status: str  # "active" | "inactive" | "none"
    current_period_end: str | None


class OverageChargeResponse(BaseModel):
    owner: str
    overage_parses: int
    request_code: str | None  # Paystack payment-request code, or None when nothing to bill


class HealthResponse(BaseModel):
    status: Literal["ok"]


class ReadyResponse(BaseModel):
    status: Literal["ok", "degraded"]
    engine: bool
    database: bool
