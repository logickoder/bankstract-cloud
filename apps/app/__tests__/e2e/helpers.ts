// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { readFile } from 'node:fs/promises'

import { expect, type Page } from '@playwright/test'

const LOG = './data/magic-e2e.log'

// Sign in via the dev magic-link flow. In e2e the worker logs the link to MAGIC_LINK_LOG_FILE
// (each line is `<email> <url>`), so each parallel worker filters by its own email and never
// races on another test's link. Use a unique email per test.
export async function signInWithMagicLink(page: Page, email: string): Promise<void> {
  await page.goto('/sign-in')
  await page.getByPlaceholder('you@company.com').fill(email)
  await page.getByRole('button', { name: 'Email me a magic link' }).click()
  await expect(page.getByText('Check your inbox')).toBeVisible()

  let url = ''
  for (let i = 0; i < 30; i++) {
    const lines = (await readFile(LOG, 'utf8').catch(() => ''))
      .trim()
      .split('\n')
      .filter(Boolean)
    const match = lines.reverse().find((line) => line.startsWith(`${email} `))
    if (match) {
      url = match.slice(email.length + 1)
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  expect(url).toContain('/api/auth/magic-link/verify')

  await page.goto(url)
  await expect(page).toHaveURL(/\/dashboard/)
}
