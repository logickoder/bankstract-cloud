// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

export type DemoErrorCode =
  | 'too_large'
  | 'wrong_type'
  | 'unauthorized'
  | 'rate_limited'
  | 'encrypted'
  | 'empty'
  | 'drift'
  | 'reconcile'
  | 'unsupported'
  | 'server_error'
  | 'network'

// The worker collapses Turnstile-failure and bad-key both to 401. The demo key is
// always valid server-side, so the realistic 401 cause is the human-verification check.
export const ERROR_COPY: Record<DemoErrorCode, string> = {
  too_large: 'File too big — 50 MB cap. Trim or split it, then try again.',
  wrong_type: 'PDF or XLSX only. Re-export from your bank app as PDF.',
  unauthorized: "Couldn't verify you're human. Refresh and try again.",
  rate_limited: "You've hit the demo limit (10 parses/hour). For higher volume, use the API.",
  encrypted:
    "That PDF is password-protected. We don't decrypt statements. Open it in any viewer, save a copy without the password, then drop it again.",
  empty:
    "Parsed clean, but found zero transactions in this period. If that's wrong, the format probably drifted. File an issue with a redacted sample.",
  drift:
    "We detected the bank but the layout broke — likely a format change. File an issue with a redacted sample.",
  reconcile:
    "The math doesn't match. Parsed totals don't line up with the statement header — usually the bank revised the PDF format. File an issue with a redacted sample.",
  unsupported:
    "Couldn't read this statement — bank not recognised, or the format drifted. We read palmpay, fbn, opay, zenith today. File an issue with a redacted sample.",
  server_error: 'Parsing failed on our side. Usually transient — try again. If it persists, file an issue.',
  network: 'Network error. Check your connection and retry.',
}

interface ErrorAction {
  label: string
  href: string
}

// Lands on a pre-labelled new-issue page (template is a separate engine follow-up).
const ENGINE_ISSUES = 'https://github.com/logickoder/bankstract/issues/new?labels=parser-drift'
const CLOUD_ISSUES = 'https://github.com/logickoder/bankstract-cloud/issues/new'

export const ERROR_ACTION: Partial<Record<DemoErrorCode, ErrorAction>> = {
  empty: { label: 'File an issue', href: ENGINE_ISSUES },
  drift: { label: 'File an issue', href: ENGINE_ISSUES },
  reconcile: { label: 'File an issue', href: ENGINE_ISSUES },
  unsupported: { label: 'File an issue', href: ENGINE_ISSUES },
  server_error: { label: 'File an issue', href: CLOUD_ISSUES },
}

// EmptyStatementError carries marker_coverage: high coverage + zero rows ≈ legitimately
// empty; lower ≈ silent layout drift. 0.95 is the engine's heuristic boundary.
const EMPTY_COVERAGE_THRESHOLD = 0.95

export function codeForStatus(status: number): DemoErrorCode {
  switch (status) {
    case 401:
      return 'unauthorized'
    case 413:
      return 'too_large'
    case 422:
      return 'unsupported'
    case 429:
      return 'rate_limited'
    default:
      return 'server_error'
  }
}

// Refine by the worker's typed error_class where it adds signal. Framework classes
// (AuthError, PayloadTooLarge, …) fall through to status mapping.
export function codeForResponse(
  status: number,
  errorClass?: string,
  markerCoverage?: number | null,
): DemoErrorCode {
  switch (errorClass) {
    case 'EncryptedSourceError':
      return 'encrypted'
    case 'EmptyStatementError':
      return (markerCoverage ?? 0) >= EMPTY_COVERAGE_THRESHOLD ? 'empty' : 'drift'
    case 'LayoutDriftError':
      return 'drift'
    case 'ReconciliationError':
      return 'reconcile'
    case 'ParseError':
      return 'unsupported'
    default:
      return codeForStatus(status)
  }
}
