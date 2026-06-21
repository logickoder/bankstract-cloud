// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

test('hero renders headline + both CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Statement parsing API')
  await expect(page.getByRole('link', { name: 'Try the demo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Read the docs' })).toBeVisible()
})

test('pricing renders the NGN tiers', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('₦9,500')).toBeVisible()
  await expect(page.getByText('₦35,000')).toBeVisible()
  await expect(page.getByText('₦150,000')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Talk to sales' }).first()).toBeVisible()
})

test('bank coverage grid lists shipped banks', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Reads Naija banks first')).toBeVisible()
  for (const bank of ['fbn', 'opay', 'palmpay', 'zenith']) {
    await expect(page.getByText(bank, { exact: true }).first()).toBeVisible()
  }
})

test('code tabs switch language panels', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Python' }).click()
  await expect(page.getByText('import requests')).toBeVisible()
})

test('transformation demo is fully static under reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  // No animation: the last CSV row + the full curl render immediately.
  await expect(page.getByRole('cell', { name: 'Airtime' })).toBeVisible()
  await expect(
    page.getByText('curl -X POST /v1/parse -F "pdf=@statement.pdf"'),
  ).toBeVisible()
})
