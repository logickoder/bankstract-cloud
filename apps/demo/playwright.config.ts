// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // /api/parse is route-mocked in specs, so these are placeholders. The short
      // Turnstile timeout keeps tests deterministic when the CF script is blocked.
      DEMO_API_KEY: 'bsk_test_e2e',
      NEXT_PUBLIC_API_URL: 'http://localhost:9',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
      NEXT_PUBLIC_TURNSTILE_TIMEOUT_MS: '300',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
