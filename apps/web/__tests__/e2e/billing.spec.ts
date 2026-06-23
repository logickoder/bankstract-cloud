// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

import { signInWithMagicLink } from './helpers'

// The worker is unreachable in e2e (WORKER_URL points at a dead port), so the billing page renders
// the inactive tier grid. We stub /api/billing/init at the browser boundary to return a same-origin
// authorization_url, so the full client flow (render -> toggle -> click -> POST -> redirect) runs
// without the real worker or Paystack.

test('authed user sees the tier plans and starts checkout', async ({ page }) => {
  await signInWithMagicLink(page, 'billing-e2e@example.com')
  await page.goto('/dashboard/billing')

  await expect(page.getByRole('heading', { name: 'Starter' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Growth' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Scale' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Monthly' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Annual/ })).toBeVisible()

  let body: unknown = null
  await page.route('**/api/billing/init', async (route) => {
    body = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authorization_url: '/dashboard/billing?checkout=stub' }),
    })
  })

  // Starter is the first card / first Subscribe button.
  await page.getByRole('button', { name: 'Subscribe' }).first().click()

  await expect(page).toHaveURL(/checkout=stub/)
  expect(body).toEqual({ tier: 'starter', interval: 'monthly' })
})

test('annual toggle shows annual price and posts the annual interval', async ({ page }) => {
  await signInWithMagicLink(page, 'billing-annual-e2e@example.com')
  await page.goto('/dashboard/billing')

  await page.getByRole('button', { name: /Annual/ }).click()
  await expect(page.getByText('₦96,900')).toBeVisible()

  let body: unknown = null
  await page.route('**/api/billing/init', async (route) => {
    body = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authorization_url: '/dashboard/billing?checkout=annual' }),
    })
  })

  // Growth is the second card / second Subscribe button.
  await page.getByRole('button', { name: 'Subscribe' }).nth(1).click()

  await expect(page).toHaveURL(/checkout=annual/)
  expect(body).toEqual({ tier: 'growth', interval: 'annual' })
})
