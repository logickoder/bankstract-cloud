// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Header, JsonLd, metadata } from '@bankstract/marketing'
import { GrainFilter } from '@bankstract/ui'
import { fraunces, instrumentSans, jetbrains } from '@bankstract/ui/fonts'

import './globals.css'

export { metadata }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`surface-paper ${fraunces.variable} ${instrumentSans.variable} ${jetbrains.variable}`}>
      <body>
        <JsonLd />
        <Header />
        <GrainFilter />
        {children}
      </body>
    </html>
  )
}
