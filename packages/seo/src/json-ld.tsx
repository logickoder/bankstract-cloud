// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ReactElement } from 'react'

// Single source for the JSON-LD `<script>` block. Every surface renders the same tag; only the
// serialized graph differs, so callers pass `data` and we own the boilerplate + the one
// dangerouslySetInnerHTML the schema requires.
export function JsonLd({ data }: { data: unknown }): ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
