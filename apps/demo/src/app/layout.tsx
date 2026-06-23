// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { JsonLd, metadata } from '@bankstract/demo'
import { GrainFilter } from '@bankstract/ui'
import { fraunces, inter, jetbrains } from '@bankstract/ui/fonts'

import './globals.css'

export { metadata }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <JsonLd />
        <GrainFilter />
        <div className="grain-fixed" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
