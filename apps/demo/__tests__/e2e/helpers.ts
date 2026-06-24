// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { Page } from '@playwright/test'

import { SYNTHETIC_PDF } from './fixtures'

// Block the Turnstile script so getToken falls back fast (deterministic tests).
export async function blockTurnstile(page: Page): Promise<void> {
  await page.route('**challenges.cloudflare.com/**', (route) => route.abort())
}

// The JSON parse path is an async job: POST /api/parse/jobs -> SSE /api/parse/jobs/{id}/stream with
// a `result` event. CSV download still hits the synchronous /api/parse. A non-200 status fails at
// submit with the worker envelope (the error specs). Exact pathname matchers, not a `parse**` glob,
// so the submit + stream routes are not swallowed by the /api/parse mock.
export async function mockParse(
  page: Page,
  opts: { status?: number; body?: unknown } = {},
): Promise<void> {
  const { status = 200, body = {} } = opts
  const json = (s: number, b: unknown) => ({
    status: s,
    contentType: 'application/json',
    body: JSON.stringify(b),
  })

  await page.route(
    (url) => url.pathname === '/api/parse',
    (route) => route.fulfill(json(status, body)),
  )

  if (status !== 200) {
    await page.route(
      (url) => url.pathname === '/api/parse/jobs',
      (route) => route.fulfill(json(status, body)),
    )
    return
  }

  await page.route(
    (url) => url.pathname === '/api/parse/jobs',
    (route) =>
      route.fulfill(
        json(202, {
          job_id: 'e2e',
          stream_url: '/api/parse/jobs/e2e/stream',
          poll_url: '/api/parse/jobs/e2e',
        }),
      ),
  )
  await page.route(
    (url) => url.pathname === '/api/parse/jobs/e2e/stream',
    (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `event: result\ndata: ${JSON.stringify({ state: 'done', result: body })}\n\n`,
      }),
  )
}

export async function mockSample(
  page: Page,
  buffer: Buffer = Buffer.from(SYNTHETIC_PDF),
): Promise<void> {
  await page.route('**/api/sample**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/pdf', body: buffer }),
  )
}

export async function dropStatement(
  page: Page,
  buffer: Buffer = Buffer.from(SYNTHETIC_PDF),
): Promise<void> {
  await page.setInputFiles('input[type="file"]', {
    name: 'statement.pdf',
    mimeType: 'application/pdf',
    buffer,
  })
}
