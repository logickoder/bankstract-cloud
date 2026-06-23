// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { defineConfig, devices } from '@playwright/test'

// Port 3002 so a running demo (3000) / marketing (3001) never collide during local e2e.
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  workers: 3,
  use: { baseURL: 'http://localhost:3002' },
  webServer: {
    command: 'mkdir -p data && pnpm exec drizzle-kit push --force && pnpm dev --port 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      BETTER_AUTH_SECRET: 'test-secret-do-not-use-in-prod-0000000000',
      BETTER_AUTH_URL: 'http://localhost:3002',
      AUTH_DB_PATH: './data/auth-e2e.db',
      MAGIC_LINK_LOG_FILE: './data/magic-e2e.log',
      WORKER_URL: 'http://localhost:9',
      ADMIN_API_TOKEN: 'test-admin-token',
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
