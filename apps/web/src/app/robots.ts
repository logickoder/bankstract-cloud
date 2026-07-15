// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { SITE_URL } from '@bankstract/seo'
import type { MetadataRoute } from 'next'

// apps/web is the merged runtime: it serves the public marketing / demo / pricing / privacy pages
// AND private dashboard, auth, and API routes. The shared allow-all robots() (used by the
// public-only shells) would invite crawlers into those, so this app disallows them explicitly.
// Private pages also carry a noindex meta (the binding signal); this keeps crawlers off the paths.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/sign-in', '/sign-up'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
