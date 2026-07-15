// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@bankstract/seo'

export const alt = 'bankstract pricing: NGN monthly subscription tiers'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpengraphImage() {
  return ogImage({
    line1: 'Pricing',
    line2: 'Pay in naira',
    subtitle: 'Self-host free. Paid tiers from NGN 9,500 a month. No lock-in.',
  })
}
