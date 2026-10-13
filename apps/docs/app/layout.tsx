// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata } from '@bankstract/seo'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

// Same three families as the main site (packages/ui/src/fonts.ts), declared here so docs stays free
// of a @bankstract/ui dependency.
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' })

export const metadata = buildMetadata({
  title: 'bankstract API docs',
  description:
    'Documentation for the bankstract statement-parsing API: quickstart, authentication, the /v1 reference, and the TypeScript SDK.',
  // Explicit image paths are not basePath-adjusted the way the file convention is, so carry /docs.
  ogImage: '/docs/opengraph-image',
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        {/* Static search: type 'static' makes the dialog download the prebuilt Orama index from
            `api` and search in-browser (no server). The url is fetched verbatim - a relative fetch
            does NOT get basePath auto-prepended the way <Link> does - so it carries the /docs prefix
            or the index 404s. */}
        <RootProvider search={{ options: { type: 'static', api: '/docs/api/search' } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
