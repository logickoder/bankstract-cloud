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
  // Local dev only: /docs is a separate app (Cloudflare Pages behind the proxy in prod), so proxy it
  // from the docs dev server (`pnpm --filter docs dev`, port 3200) to keep one origin, like prod.
  rewrites() {
    if (process.env.NODE_ENV === 'production') return Promise.resolve([])
    const docs = process.env.DOCS_DEV_ORIGIN ?? 'http://localhost:3200'
    return Promise.resolve([{ source: '/docs/:path*', destination: `${docs}/docs/:path*` }])
  },
}

export default config
