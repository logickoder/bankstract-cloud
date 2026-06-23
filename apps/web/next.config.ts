// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

// The single prod web app: / marketing, /demo, /app dashboard. One Next runtime, one /_next,
// no basePath (each surface is a real route segment). Docs lives on Cloudflare Pages at /docs.
const config: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: [
    '@bankstract/demo',
    '@bankstract/marketing',
    '@bankstract/seo',
    '@bankstract/types',
    '@bankstract/ui',
  ],
  // libSQL client ships prebuilt native bits; keep it external so it isn't bundled.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  turbopack: {},
}

export default config
