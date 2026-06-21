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

export interface KeyInfo {
  id: string
  name: string
  prefix: string
  env: string
  tier: string
  owner: string | null
  created_at: string
  revoked_at: string | null
}

export interface OwnerUsage {
  owner: string
  period_parses: number
  success_rate: number
  daily: { date: string; count: number }[]
}
