// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { docs } from 'collections/server'
import { loader } from 'fumadocs-core/source'


// TODO(openapi): re-add `plugins: [openapiPlugin()]` + openapi.staticSource() to wire
// the interactive API reference once the fumadocs-openapi v11 render path is settled.
// The scaffolding (lib/openapi.ts, components/api-page.tsx, scripts/generate-docs.ts,
// the committed openapi.json) is ready.
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
})
