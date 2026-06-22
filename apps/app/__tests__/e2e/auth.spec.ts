// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { expect, test } from '@playwright/test'

import { signInWithMagicLink } from './helpers'

test('unauthenticated dashboard redirects to sign-in', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/sign-in/)
})

test('sign-in shows OAuth options + magic-link', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible()
  await expect(page.getByPlaceholder('you@company.com')).toBeVisible()
})

test('magic-link sign-in lands on the dashboard, then signs out', async ({ page }) => {
  await signInWithMagicLink(page, 'e2e@example.com')
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/sign-in/)
})
