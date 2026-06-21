// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { readFile, writeFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

const LOG = './data/magic-e2e.log'

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
  await writeFile(LOG, '')
  await page.goto('/sign-in')
  await page.getByPlaceholder('you@company.com').fill('e2e@example.com')
  await page.getByRole('button', { name: 'Email me a magic link' }).click()
  await expect(page.getByText('Check your inbox')).toBeVisible()

  let url = ''
  for (let i = 0; i < 25; i++) {
    const line = (await readFile(LOG, 'utf8').catch(() => ''))
      .trim()
      .split('\n')
      .filter(Boolean)
      .pop()
    if (line) {
      url = line
      break
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  expect(url).toContain('/api/auth/magic-link/verify')

  await page.goto(url)
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/sign-in/)
})
