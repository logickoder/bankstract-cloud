// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { defineConfig, devices } from '@playwright/test'

// Port 3002 so a running demo (3000) / marketing (3001) never collide during local e2e.
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://localhost:3002' },
  webServer: [
    {
      // Answers billing status only (see the file). Every other worker call fails like a dead worker.
      command: 'node __tests__/e2e/stub-worker.mjs',
      url: 'http://127.0.0.1:8765/v1/admin/billing/status',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'mkdir -p data && pnpm exec drizzle-kit push --force && pnpm dev --port 3002',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BETTER_AUTH_SECRET: 'test-secret-do-not-use-in-prod-0000000000',
        BETTER_AUTH_URL: 'http://localhost:3002',
        AUTH_DB_PATH: './data/auth-e2e.db',
        MAGIC_LINK_LOG_FILE: './data/magic-e2e.log',
        // Force the magic link to the log file, never email. A dev's .env.local RESEND_API_KEY
        // would otherwise make the dev server send real emails and the sign-in helper find nothing.
        RESEND_API_KEY: '',
        WORKER_URL: 'http://127.0.0.1:8765',
        ADMIN_API_TOKEN: 'test-admin-token',
      },
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
