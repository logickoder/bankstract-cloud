// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Server-only worker proxy. Holds ADMIN_API_TOKEN and forwards to the worker's
// admin-gated endpoints; the browser never sees the admin token. All calls are scoped by
// the session user's id as `owner`, and the app enforces per-user isolation.
// Default to 127.0.0.1 (not `localhost`): Node resolves localhost to ::1 first, so a
// v4-only worker costs a refused IPv6 round-trip before the v4 retry.
const WORKER_URL = process.env.WORKER_URL ?? 'http://127.0.0.1:8000'
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? ''

// Same box, so a healthy worker answers in single-digit ms. Fail fast when it is down
// rather than hanging the dashboard for undici's ~10s connect timeout.
const WORKER_TIMEOUT_MS = 4000

export function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${WORKER_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ADMIN_TOKEN}`,
      ...init?.headers,
    },
    cache: 'no-store',
    signal: init?.signal ?? AbortSignal.timeout(WORKER_TIMEOUT_MS),
  })
}

// Re-emit the worker's JSON + status verbatim to the browser.
export async function passthrough(res: Response): Promise<Response> {
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  })
}

// Worker /v1 wire contract lives once in @bankstract/types (mirrors the worker pydantic
// models). Re-exported here so dashboard code keeps a single `@/lib/worker` import surface.
export type {
  KeyCreatedResponse,
  KeyInfo,
  OwnerUsageResponse as OwnerUsage,
  SubscribeResponse,
  SubscriptionStatusResponse,
} from '@bankstract/types'
