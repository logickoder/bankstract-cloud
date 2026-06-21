// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { openapiPlugin } from 'fumadocs-openapi/server'

// openapiPlugin reads the `_openapi` frontmatter that `pnpm gen` writes into the
// generated content/docs/api/*.mdx pages and attaches getOpenAPIPageProps() to each,
// which the slug route renders as an interactive operation page.
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [openapiPlugin()],
})
