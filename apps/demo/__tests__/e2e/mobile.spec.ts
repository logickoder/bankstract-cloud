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

test('no horizontal overflow on small screens (idle + result)', async ({ page }) => {
  await blockTurnstile(page)
  await mockParse(page, { body: FIXTURE_RESPONSE })
  const noOverflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )

  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/')
    expect(await noOverflow()).toBeLessThanOrEqual(1)
    await dropStatement(page)
    expect(await noOverflow()).toBeLessThanOrEqual(1)
  }
})
