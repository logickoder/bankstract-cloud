// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { MetadataRoute } from 'next'

import { SITE_URL } from './site'

// Allow-all + sitemap pointer. Re-export as the default from each app's app/robots.ts.
export function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
