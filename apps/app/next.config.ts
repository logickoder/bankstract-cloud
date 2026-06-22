// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

const config: NextConfig = {
  output: 'standalone',
  // Path-routed behind Caddy in prod (the box serves the app under /app). Set at BUILD time via
  // APP_BASE_PATH so dev + e2e stay at root (unset). Auth URLs follow: BETTER_AUTH_URL must
  // include the prefix and OAuth callbacks move under /app (see infra-prod/README).
  basePath: process.env.APP_BASE_PATH || undefined,
  // The bottom-left "N" dev badge is dev-only (never in prod). Hide it so dev screenshots
  // match production chrome.
  devIndicators: false,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@bankstract/types', '@bankstract/ui'],
  // libSQL client ships prebuilt native bits; keep it external so it isn't bundled.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  turbopack: {},
}

export default config
