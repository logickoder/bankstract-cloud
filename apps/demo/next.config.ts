// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { NextConfig } from 'next'

const config: NextConfig = {
  // @bankstract/types ships TS source (no build step) — Next must transpile it.
  transpilePackages: ['@bankstract/types'],
  turbopack: {},
}

export default config
