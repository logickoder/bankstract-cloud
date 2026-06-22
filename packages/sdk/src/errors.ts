// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ErrorResponse } from '@bankstract/types'

interface ErrorFields {
  status: number
  errorClass: string
  formatVersion?: string | null
  markerCoverage?: number | null
}

export class BankstractError extends Error {
  readonly status: number
  /** The server `error_class` (e.g. `LayoutDriftError`, `subscription_inactive`). */
  readonly errorClass: string
  readonly formatVersion: string | null
  /** Only meaningful for `EmptyStatementError` (422): high coverage + zero rows = likely empty. */
  readonly markerCoverage: number | null

  constructor(message: string, fields: ErrorFields) {
    super(message)
    // Subclass name without relying on a hardcoded string per class.
    this.name = new.target.name
    this.status = fields.status
    this.errorClass = fields.errorClass
    this.formatVersion = fields.formatVersion ?? null
    this.markerCoverage = fields.markerCoverage ?? null
  }
}

/** 401: missing or invalid API key. */
export class AuthError extends BankstractError {}
/** 402: the key's subscription is inactive. */
export class SubscriptionInactiveError extends BankstractError {}
/** 413: file exceeds the 50MB cap. */
export class PayloadTooLargeError extends BankstractError {}
/** 422: no parser detected / layout drift / reconciliation failure (see `errorClass`). */
export class UnsupportedStatementError extends BankstractError {}
/** 5xx: internal worker error (carries `formatVersion`). */
export class ServerError extends BankstractError {}
/** The request was aborted (per-call timeout or caller signal). */
export class TimeoutError extends BankstractError {}

/** 429: rate limit exceeded. `retryAfter` is the `Retry-After` header in seconds, if sent. */
export class RateLimitError extends BankstractError {
  readonly retryAfter: number | null

  constructor(message: string, fields: ErrorFields & { retryAfter?: number | null }) {
    super(message, fields)
    this.retryAfter = fields.retryAfter ?? null
  }
}

function defaultClass(status: number): string {
  if (status === 401) return 'AuthError'
  if (status === 402) return 'subscription_inactive'
  if (status === 413) return 'PayloadTooLarge'
  if (status === 422) return 'ParseError'
  if (status === 429) return 'RateLimitError'
  return 'WorkerError'
}

/** Map a non-2xx response (the worker `ErrorResponse` envelope) to a typed error. Tolerates a
 *  missing/non-JSON body on 5xx. The API key never appears in the message or fields. */
export async function errorFromResponse(res: Response): Promise<BankstractError> {
  const body = (await res.json().catch(() => null)) as ErrorResponse | null
  const message = body?.error ?? `bankstract request failed (${res.status})`
  const fields: ErrorFields = {
    status: res.status,
    errorClass: body?.error_class ?? defaultClass(res.status),
    formatVersion: body?.format_version ?? null,
    markerCoverage: body?.marker_coverage ?? null,
  }
  switch (res.status) {
    case 401:
      return new AuthError(message, fields)
    case 402:
      return new SubscriptionInactiveError(message, fields)
    case 413:
      return new PayloadTooLargeError(message, fields)
    case 422:
      return new UnsupportedStatementError(message, fields)
    case 429: {
      const header = res.headers.get('retry-after')
      const retryAfter = header !== null && header.trim() !== '' ? Number(header) : null
      return new RateLimitError(message, {
        ...fields,
        retryAfter: retryAfter !== null && Number.isFinite(retryAfter) ? retryAfter : null,
      })
    }
    default:
      return new ServerError(message, fields)
  }
}
