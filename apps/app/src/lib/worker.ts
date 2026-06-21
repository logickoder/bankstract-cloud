// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Server-only worker proxy. Holds ADMIN_API_TOKEN and forwards to the worker's
// admin-gated endpoints; the browser never sees the admin token. All calls are scoped by
// the session user's id as `owner`, and the app enforces per-user isolation.
const WORKER_URL = process.env.WORKER_URL ?? 'http://localhost:8000'
const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? ''

export function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${WORKER_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${ADMIN_TOKEN}`,
      ...init?.headers,
    },
    cache: 'no-store',
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
} from '@bankstract/types'
