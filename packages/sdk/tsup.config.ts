// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { defineConfig } from 'tsup'

// Dual ESM + CJS for Node 18+ backends. `dts.resolve` inlines @bankstract/types' declarations
// into a single dist/index.d.ts, so the published package carries no @bankstract/types dependency
// (consumers install only @logickoder/bankstract).
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: { resolve: true },
  target: 'node18',
  clean: true,
  treeshake: true,
  sourcemap: true,
})
