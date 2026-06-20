// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { Page } from '@playwright/test'

import { SYNTHETIC_PDF } from './fixtures'

// Block the Turnstile script so getToken falls back fast (deterministic tests).
export async function blockTurnstile(page: Page): Promise<void> {
  await page.route('**challenges.cloudflare.com/**', (route) => route.abort())
}

export async function mockParse(
  page: Page,
  opts: { status?: number; body?: unknown } = {},
): Promise<void> {
  const { status = 200, body = {} } = opts
  await page.route('**/api/parse**', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
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
