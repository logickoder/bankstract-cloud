// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { NextConfig } from 'next'

// Monorepo root. Next traces workspace deps (@bankstract/ui) from here for the
// standalone output used by the self-host Docker image.
const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,
  // @bankstract/ui ships TS source (no build step). Next must transpile it.
  transpilePackages: ['@bankstract/ui'],
  turbopack: {},
}

export default config
