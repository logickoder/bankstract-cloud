// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// client + types are fully public; re-export wholesale so adding a member is a one-file change.
export * from './client'
export type * from './types'

// errors are listed explicitly: `errorFromResponse` is internal (used by http) and must NOT leak.
export {
  AuthError,
  BankstractError,
  PayloadTooLargeError,
  RateLimitError,
  ServerError,
  SubscriptionInactiveError,
  TimeoutError,
  UnsupportedStatementError,
} from './errors'
