// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata } from '@bankstract/seo'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata = buildMetadata({
  title: 'bankstract API docs',
  description:
    'Documentation for the bankstract statement-parsing API: quickstart, authentication, the /v1 reference, and the TypeScript SDK.',
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
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
