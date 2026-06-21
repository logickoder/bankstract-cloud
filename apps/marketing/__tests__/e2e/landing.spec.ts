// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

test('hero renders headline + both CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Statement parsing API')
  await expect(page.getByRole('link', { name: 'Try the demo' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Read the docs' })).toBeVisible()
})

test('pricing renders NGN tiers with waitlist CTAs (Paystack not live)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('₦9,500')).toBeVisible()
  await expect(page.getByText('₦35,000')).toBeVisible()
  await expect(page.getByText('₦150,000')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Notify me on launch' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Talk to sales' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start', exact: true })).toHaveCount(0)
})

test('bank grid lists shipped NG banks and excludes wise', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Reads Naija banks first')).toBeVisible()
  for (const bank of ['fbn', 'opay', 'palmpay', 'zenith']) {
    await expect(page.getByText(bank, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByText('wise', { exact: true })).toHaveCount(0)
})

test('renamed headings + footer voice anchor', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'NDPR by default' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Fails noisy' })).toBeVisible()
  await expect(page.getByText('Built in Lagos.')).toBeVisible()
})

test('code tabs switch language panels', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('tab', { name: 'Python' }).click()
  await expect(page.getByText('import requests')).toBeVisible()
})

test('code blocks have a working copy button', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  const copy = page.getByRole('button', { name: 'Copy code' }).first()
  await expect(copy).toBeVisible()
  await copy.click()
  await expect(page.getByRole('button', { name: 'Copied' }).first()).toBeVisible()
})

test('no horizontal overflow on small screens', async ({ page }) => {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  }
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
