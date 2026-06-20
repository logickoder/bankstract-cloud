// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

import { FIXTURE_RESPONSE } from './fixtures'
import { blockTurnstile, dropStatement, mockParse } from './helpers'

test('renders the card layout (not the table) at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await blockTurnstile(page)
  await mockParse(page, { body: FIXTURE_RESPONSE })

  await page.goto('/')
  await dropStatement(page)

  // Mobile card shows a single signed amount; the desktop column headers are hidden.
  await expect(page.getByText('+ ₦500.00')).toBeVisible()
  await expect(page.getByText('DEBIT', { exact: true })).toBeHidden()
})
