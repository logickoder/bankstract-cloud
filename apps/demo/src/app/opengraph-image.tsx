// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@bankstract/seo'

export const alt = 'bankstract: drop your bank statement, get clean transactions'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return ogImage({
    line1: 'Drop your bank statement',
    line2: 'get clean transactions',
    subtitle: 'PDF in, structured data out. No signup, no storage. Processed in memory.',
  })
}
