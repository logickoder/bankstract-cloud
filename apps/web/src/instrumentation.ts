// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import * as Sentry from '@sentry/nextjs'

import { initSentry } from './lib/sentry'

// Next runs this once at server startup. Node runtime only (no edge); the SDK init + the
// onRequestError hook capture route-handler and RSC errors without the build-time plugin, which
// keeps the Turbopack build clean and uploads no source maps.
export function register(): void {
  if (process.env.NEXT_RUNTIME === 'nodejs') initSentry()
}

export const onRequestError = Sentry.captureRequestError
