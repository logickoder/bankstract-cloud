// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Wire contract for the worker's /v1 API. This MIRRORS apps/worker/src/bankstract_cloud/models.py
// exactly — keep the two in lockstep. Money crosses the wire as a decimal string (never a
// JS number — float would corrupt naira precision); datetimes as ISO 8601 strings.

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

export interface ParseResponse {
  format_version: string | null
  metadata: StatementMetadata | null
  totals: Totals
  row_wise_reconcilable: boolean
  transactions: Transaction[]
}

export interface ErrorResponse {
  error: string
  error_class: string
  format_version: string | null
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
  /** Successful parses in the current calendar-month billing period. */
  period_parses: number
  /** USD, fixed 2dp string, e.g. "12.30". */
  projected_invoice_usd: DecimalString
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

// /v1/parse?redact=true returns the redacted document bytes (not JSON) with these headers.
export const REDACT_HEADERS = {
  redactions: 'X-Bankstract-Redactions',
  formatVersion: 'X-Bankstract-Format-Version',
} as const

export type RedactFormat = 'pdf' | 'xlsx'

export const REDACT_MEDIA_TYPES: Record<RedactFormat, string> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}
