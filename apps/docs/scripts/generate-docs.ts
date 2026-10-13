// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { readFile, writeFile } from 'node:fs/promises'

import { generateFiles } from 'fumadocs-openapi'

import { openapi } from '../lib/openapi'

// Turn the committed openapi.json into one MDX page per operation under
// content/docs/api/. Run via `pnpm gen` (wired into predev/prebuild).
await generateFiles({
  input: openapi,
  output: './content/docs/api',
  meta: true,
})

// The generated folder would otherwise show in the sidebar as "Api", next to the hand-written "API
// reference" page. Give it its own name. Done here because content/docs/api/ is regenerated (and
// gitignored), so editing the file by hand would not last.
const metaPath = './content/docs/api/meta.json'
const meta = JSON.parse(await readFile(metaPath, 'utf8')) as Record<string, unknown>
await writeFile(metaPath, `${JSON.stringify({ title: 'Endpoints', ...meta }, null, 2)}\n`)
