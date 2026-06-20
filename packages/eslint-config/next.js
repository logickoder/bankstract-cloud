// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import nextPlugin from '@next/eslint-plugin-next'

import { base } from './base.js'

// Shared flat config for Next.js apps — base rules + the Next plugin. Apps spread this
// and add their own `ignores`.
export const next = [
  ...base,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
]
