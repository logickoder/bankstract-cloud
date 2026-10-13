// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// A stand-in worker for e2e. It answers one call: billing status for an owner with no plan, so the
// billing page renders the tier grid. Every other path returns 503, like an unreachable worker, so
// the dashboard's "unavailable" states stay exercised. Started by playwright.config.ts.
import { createServer } from 'node:http'
import process from 'node:process'
import { URL } from 'node:url'

const port = Number(process.env.STUB_WORKER_PORT ?? 8765)

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`)
  if (req.method === 'GET' && url.pathname === '/v1/admin/billing/status') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify({
        owner: url.searchParams.get('owner') ?? '',
        tier: null,
        status: 'none',
        current_period_end: null,
      }),
    )
    return
  }
  res.writeHead(503, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ error: 'stub worker: not implemented' }))
}).listen(port, '127.0.0.1')
