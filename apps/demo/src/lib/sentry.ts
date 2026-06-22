// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import * as Sentry from '@sentry/nextjs'

// Privacy posture mirrors the worker (observability.py), adapted for Next: errors only, no PII,
// and a scrub that strips the request body/headers/cookies. Sentry runs SERVER-SIDE ONLY here
// (no browser SDK), so anything a user types or uploads in the browser never reaches Sentry.
// Directive 1.

export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request) {
    // The request body can carry form fields / the Authorization header carries the session.
    delete event.request.data
    delete event.request.headers
    delete event.request.cookies
    delete event.request.query_string
  }
  return event
}

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return // no DSN => disabled (dev/test): no network, no reports. Mirrors the worker no-op.
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0, // errors only, no transaction/perf payloads
    sendDefaultPii: false, // no cookies, Authorization header, or client IP
    beforeSend: scrubEvent,
  })
}
