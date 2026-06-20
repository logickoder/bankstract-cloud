// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { generateFiles } from 'fumadocs-openapi'

import { openapi } from '../lib/openapi'

// Turn the committed openapi.json into one MDX page per operation under
// content/docs/api/. Run via `pnpm gen` (wired into predev/prebuild).
await generateFiles({
  input: openapi,
  output: './content/docs/api',
  meta: true,
})
