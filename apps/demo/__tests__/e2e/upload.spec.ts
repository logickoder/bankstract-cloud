// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

import { FIXTURE_RESPONSE } from './fixtures'
import { blockTurnstile, dropStatement, mockParse } from './helpers'

test('parses a statement and renders the preview table', async ({ page }) => {
  await blockTurnstile(page)
  await mockParse(page, { body: FIXTURE_RESPONSE })

  await page.goto('/')
  await dropStatement(page)

  await expect(page.getByText('FOO TRANSFER').first()).toBeVisible()
  await expect(page.getByText('500.00').first()).toBeVisible()
  await expect(page.getByText('reconciled')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download JSON' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download CSV' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Parse another' })).toBeVisible()
})
