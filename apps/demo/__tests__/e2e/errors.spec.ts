// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

import { blockTurnstile, dropStatement, mockParse } from './helpers'

const CASES = [
  { status: 422, snippet: 'read this statement' },
  { status: 429, snippet: 'demo limit' },
  { status: 413, snippet: 'too big' },
]

for (const { status, snippet } of CASES) {
  test(`surfaces worker ${status} as an error state`, async ({ page }) => {
    await blockTurnstile(page)
    await mockParse(page, { status, body: { error: 'x', error_class: 'X' } })

    await page.goto('/')
    await dropStatement(page)

    await expect(page.getByText(snippet, { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try another file' })).toBeVisible()
  })
}

const TYPED = [
  { body: { error_class: 'ReconciliationError' }, snippet: "The math doesn't match" },
  { body: { error_class: 'EncryptedSourceError' }, snippet: 'password-protected' },
  { body: { error_class: 'EmptyStatementError', marker_coverage: 0.99 }, snippet: 'zero transactions' },
  { body: { error_class: 'EmptyStatementError', marker_coverage: 0.4 }, snippet: 'layout broke' },
  { body: { error_class: 'LayoutDriftError' }, snippet: 'layout broke' },
]

for (const { body, snippet } of TYPED) {
  test(`maps ${body.error_class} (coverage ${body.marker_coverage ?? 'n/a'})`, async ({ page }) => {
    await blockTurnstile(page)
    await mockParse(page, { status: 422, body: { error: 'x', ...body } })

    await page.goto('/')
    await dropStatement(page)

    await expect(page.getByText(snippet, { exact: false })).toBeVisible()
  })
}
