// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { SITE_URL } from '@bankstract/seo'
import type { MetadataRoute } from 'next'

import { source } from '@/lib/source'

// output:'export' prerenders metadata routes to static files; mark it fully static.
export const dynamic = 'force-static'

// Every doc + generated API page, so search engines find the whole reference.
export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
}
