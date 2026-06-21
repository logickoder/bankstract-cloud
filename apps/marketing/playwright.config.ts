// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { defineConfig, devices } from '@playwright/test'

// Port 3001 so a running demo (3000) never collides during local e2e.
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  // Cap workers: all specs hit one page, and a thundering herd against the first
  // (uncached) Turbopack compile flakes. 3 keeps it parallel but stable.
  workers: 3,
  use: { baseURL: 'http://localhost:3001' },
  webServer: {
    command: 'pnpm dev --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
