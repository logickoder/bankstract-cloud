// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createFromSource } from 'fumadocs-core/search/server'

import { source } from '@/lib/source'

// Static export: staticGET emits the Orama index as a build-time JSON file at /docs/api/search
// instead of a runtime handler. The browser downloads it once and searches client-side (see the
// RootProvider static client in app/layout.tsx). revalidate=false marks the route fully static.
export const revalidate = false

export const { staticGET: GET } = createFromSource(source, {
  language: 'english',
})
