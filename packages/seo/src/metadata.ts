// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { Metadata } from 'next'

import { SITE_URL } from './site'

interface BuildMetadataInput {
  title: string
  description: string
  /** Canonical path for this surface. Default '/'. */
  path?: string
  keywords?: string[]
}

// One Metadata shape for every surface: metadataBase, title template, canonical, OG, Twitter.
// The OG/Twitter image is wired automatically by each route's opengraph-image file.
export function buildMetadata({
  title,
  description,
  path = '/',
  keywords,
}: BuildMetadataInput): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s · bankstract' },
    description,
    applicationName: 'bankstract',
    keywords,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: 'bankstract', url: SITE_URL, title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}
