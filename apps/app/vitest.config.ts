// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Match Next's automatic JSX runtime so component tests need no `import React`.
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  test: {
    // Node by default (route handlers are server-only). Component tests opt into jsdom with a
    // `// @vitest-environment jsdom` docblock so they get a DOM without forcing it on the rest.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    passWithNoTests: true,
  },
})
