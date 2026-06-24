// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@bankstract/seo'

export const alt = 'bankstract: statement parsing API for Nigerian banks'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return ogImage({
    line1: 'Statement parsing API',
    line2: 'for Nigerian banks',
    subtitle: 'One API call. Clean transactions, account metadata, NDPR-compliant redaction.',
  })
}
