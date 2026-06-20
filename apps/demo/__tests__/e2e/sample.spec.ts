// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

import { FIXTURE_RESPONSE } from './fixtures'
import { blockTurnstile, mockParse, mockSample } from './helpers'

test('loads a sample statement and flags it as redacted', async ({ page }) => {
  await blockTurnstile(page)
  await mockSample(page)
  await mockParse(page, { body: FIXTURE_RESPONSE })

  await page.goto('/')
  await page.getByRole('button', { name: 'Try a sample' }).click()

  await expect(page.getByText(/Showing a redacted .*sample/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'try another bank' })).toBeVisible()
  await expect(page.getByText('FOO TRANSFER').first()).toBeVisible()
})
