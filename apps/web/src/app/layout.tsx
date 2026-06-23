// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata } from '@bankstract/seo'
import { GrainFilter } from '@bankstract/ui'
import { fraunces, inter, jetbrains } from '@bankstract/ui/fonts'

import './globals.css'

// Shared shell for every surface (marketing /, demo /demo, dashboard /app). Per-route-group
// layouts add their own JSON-LD + metadata; this sets the metadataBase + a sensible default.
export const metadata = buildMetadata({
  title: 'bankstract: bank statement parsing API for Nigerian banks',
  description:
    'Parse Nigerian bank statement PDFs into clean transactions over one API call. Free browser demo, developer dashboard, and OSS self-host.',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <GrainFilter />
        {children}
      </body>
    </html>
  )
}
