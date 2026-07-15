// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@bankstract/seo'

export const alt = 'bankstract privacy: statements processed in memory, never stored'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return ogImage({
    line1: 'Privacy',
    line2: 'is the product',
    subtitle: 'PDF bytes processed in memory. Never written to disk. Metadata only.',
  })
}
