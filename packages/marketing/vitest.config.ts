// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Match Next's automatic JSX runtime so a component can be rendered to markup without `import React`.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
