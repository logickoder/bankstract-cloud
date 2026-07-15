// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { SITE_URL } from '@bankstract/seo'
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/pricing`, changeFrequency: 'weekly', priority: 0.8 },
  ]
}
