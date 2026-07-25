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
  /**
   * Origin-absolute path to this surface's 1200x630 card (an `ogRoute` handler; see og.tsx for why
   * it's carried here and not left to the opengraph-image file convention). Default the shared root
   * card. Paths here are NOT basePath/mount adjusted, so pass the real origin-absolute path for
   * prefixed or re-mounted surfaces (docs '/docs/opengraph-image', a card at /pricing '/pricing/og').
   */
  ogImage?: string
}

// One Metadata shape for every surface: metadataBase, title template, canonical, OG, Twitter, card.
export function buildMetadata({
  title,
  description,
  path = '/',
  keywords,
  ogImage = '/og',
}: BuildMetadataInput): Metadata {
  const images = [{ url: ogImage, width: 1200, height: 630, alt: title }]
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: '%s · bankstract' },
    description,
    applicationName: 'bankstract',
    keywords,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: 'bankstract', url: SITE_URL, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}
