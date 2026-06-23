// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'
import { openapiPlugin } from 'fumadocs-openapi/server'

// openapiPlugin reads the `_openapi` frontmatter that `pnpm gen` writes into the
// generated content/docs/api/*.mdx pages and attaches getOpenAPIPageProps() to each,
// which the slug route renders as an interactive operation page.
// baseUrl is '/' (root), not '/docs': Next's basePath ('/docs' in next.config) prepends the prefix
// to every <Link> href, so page urls + pageTree links must be root-relative or they double to
// /docs/docs/*. The route tree lives in the (docs) group, which adds no URL segment.
export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  plugins: [openapiPlugin()],
})
