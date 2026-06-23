// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@bankstract/seo'

export const alt = 'bankstract API docs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return ogImage({
    line1: 'API',
    line2: 'docs',
    subtitle: 'Quickstart, authentication, the /v1 reference, and the TypeScript SDK.',
  })
}
