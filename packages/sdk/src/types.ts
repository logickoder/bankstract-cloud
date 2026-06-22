// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// The wire contract is single-sourced in @bankstract/types (mirrors the worker pydantic models).
// Re-exported here, then bundled into dist/index.d.ts at build so the published package is
// self-contained. Never re-declare these shapes; extend them only with SDK-only types below.
export type {
  BankInfo,
  BanksResponse,
  ErrorResponse,
  ParseResponse,
  RedactFormat,
  StatementMetadata,
  Totals,
  Transaction,
  UsageResponse,
} from '@bankstract/types'

import type { RedactFormat } from '@bankstract/types'

export interface RedactResult {
  /** Redacted document bytes, in memory. The SDK never writes them to disk. */
  data: Uint8Array
  format: RedactFormat
  formatVersion: string | null
  /** Count of redactions applied, from the `X-Bankstract-Redactions` header. */
  redactions: number
}
