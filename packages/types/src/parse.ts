// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Wire contract for the worker's /v1 API. This MIRRORS apps/worker/src/bankstract_cloud/models.py
// exactly. Keep the two in lockstep. Money crosses the wire as a decimal string (never a
// JS number, since float would corrupt naira precision); datetimes as ISO 8601 strings.

/** A decimal serialized as a string, e.g. "250.50" or "0". Never parse with `Number()`. */
export type DecimalString = string

/** ISO 8601 datetime without timezone, e.g. "2026-01-05T09:30:00". */
export type IsoDateTime = string

export interface Transaction {
  date: IsoDateTime
  narration: string
  debit: DecimalString
  credit: DecimalString
  balance: DecimalString | null
  reference: string | null
  currency: string
  /** True only when the statement printed a real time for this row (not a padded 00:00:00). */
  has_time: boolean
}

export interface StatementMetadata {
  bank: string | null
  account_holder: string | null
  account_number_masked: string | null
  statement_period_start: IsoDateTime | null
  statement_period_end: IsoDateTime | null
  opening_balance: DecimalString | null
  closing_balance: DecimalString | null
}

export interface Totals {
  credit: DecimalString | null
  debit: DecimalString | null
}

// totals: not_available when the statement prints no header totals. row_wise: not_available when
// some row has no balance, disabled when the parser opts out (OPay's OWealth moves break the
// running balance). A failed check never reaches here: it is a 422 ReconciliationError.
export type CheckStatus = 'passed' | 'not_available' | 'disabled'

export interface Reconciliation {
  totals: CheckStatus
  row_wise: CheckStatus
  /** Parser's reason row-wise is disabled (e.g. opay's OWealth moves). Null unless disabled. */
  row_wise_reason: string | null
}

export interface ParseResponse {
  format_version: string | null
  metadata: StatementMetadata | null
  totals: Totals
  reconciliation: Reconciliation
  transactions: Transaction[]
}

// Envelope for all non-2xx responses. error_class is one of: EncryptedSourceError,
// EmptyStatementError (see marker_coverage), LayoutDriftError, ReconciliationError,
// ResourceLimitError (the file passed the processing limits and was stopped), removed_parameter
// (a field this API no longer takes, e.g. redact on /v1/parse), ParseError, or a
// framework class (AuthError, PayloadTooLarge, RateLimitError, subscription_inactive on 402 when a
// live key has no active subscription, …).
export interface ErrorResponse {
  error: string
  error_class: string
  format_version: string | null
  /** Populated only for EmptyStatementError: high coverage + zero rows ≈ truly empty. */
  marker_coverage: number | null
}

export type IntegritySeverity = 'warn' | 'error'

// One piece of evidence about a statement file (POST /v1/inspect). `code` is a plain string on
// purpose: the engine can add codes in a minor release and a client must not break on an unseen one.
// `detail` quotes the statement (amounts, balances, covered text): it is the caller's own data, so
// show it to the statement's owner and never log it. Log `code`, `severity`, `page` and `row`.
export interface IntegritySignal {
  code: string
  severity: IntegritySeverity
  detail: string
  /** 1-based. */
  page: number | null
  /** 0-based index into the statement's transactions. */
  row: number | null
}

// Evidence about whether a statement file was edited. Never a verdict: a forger who regenerates the
// file with the bank's own library and recomputes every balance passes every check. `clean` means
// no signals. A `checks_skipped` warning means a check could not run on part of the file.
export interface IntegrityReport {
  bank: string | null
  format_version: string | null
  signals: IntegritySignal[]
  clean: boolean
}

export interface BankInfo {
  id: string
}

export interface BanksResponse {
  banks: BankInfo[]
  engine_version: string
}

export interface UsageResponse {
  api_key_id: string
  /** Paid tier ("starter" | "growth" | "scale"), or null for a test key / no subscription. */
  tier: string | null
  /** Successful parses across the owner's keys this cycle (failures never count). */
  period_parses: number
  /** Included monthly parses for the tier; null when there is no cap. */
  monthly_cap: number | null
  /** Parses beyond the cap this cycle. */
  overage_parses: number
  /** Projected overage in NGN, exact 2dp string (e.g. "1530.00"). "0.00" within cap. */
  projected_overage_naira: DecimalString
}

export interface StatusResponse {
  status: 'ok'
  worker_version: string
  engine_version: string
}

export interface HealthResponse {
  status: 'ok'
}

export interface ReadyResponse {
  status: 'ok' | 'degraded'
  engine: boolean
  database: boolean
}

// POST /v1/redact returns the redacted document bytes (not JSON) with these headers.
export const REDACT_HEADERS = {
  redactions: 'X-Bankstract-Redactions',
  formatVersion: 'X-Bankstract-Format-Version',
} as const

export type RedactFormat = 'pdf' | 'xlsx'

export const REDACT_MEDIA_TYPES: Record<RedactFormat, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

// Owner usage aggregation. /v1/admin/usage powers the dashboard Overview + Usage.
export interface DailyCount {
  date: string
  count: number
}

export interface OwnerUsageResponse {
  owner: string
  /** Subscription tier, or null when the owner has no active paid tier. */
  tier: string | null
  period_parses: number
  /** 0..1: successful parses / total attempts this cycle. */
  success_rate: number
  /** Included parses for the tier, or null when there is no cap (no paid tier). */
  monthly_cap: number | null
  overage_parses: number
  /** Projected overage in NGN, exact 2dp string (e.g. "1530.00"). "0.00" within cap. */
  projected_overage_naira: string
  daily: DailyCount[]
}

// API-key management (admin-only endpoints under /v1/keys).
export interface KeyInfo {
  id: string
  name: string
  prefix: string
  tier: string
  owner: string | null
  created_at: string
  revoked_at: string | null
}

// Returned once, on creation: the only time the raw `key` is ever exposed.
export interface KeyCreatedResponse {
  id: string
  key: string
  prefix: string
  name: string
  tier: string
}

export interface KeyListResponse {
  keys: KeyInfo[]
}

// Billing (Paystack). The worker holds the secret; apps/app proxies these admin endpoints.
export interface SubscribeResponse {
  authorization_url: string
  access_code: string
  reference: string
}

export interface SubscriptionStatusResponse {
  owner: string
  tier: string | null
  /** "active" | "inactive" | "none". Only "active" lets a live key parse. */
  status: string
  current_period_end: string | null
}
