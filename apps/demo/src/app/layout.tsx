// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { JsonLd, metadata as demoMetadata } from '@bankstract/demo'
import { GrainFilter } from '@bankstract/ui'
import { fraunces, inter, jetbrains } from '@bankstract/ui/fonts'

import './globals.css'

// The shared demo metadata points its card at /demo/og (its mount inside apps/web). This
// standalone shell serves the demo at the root, so its card lives at /og.
const images = [{ url: '/og', width: 1200, height: 630, alt: 'bankstract demo' }]
export const metadata = {
  ...demoMetadata,
  openGraph: { ...demoMetadata.openGraph, images },
  twitter: { ...demoMetadata.twitter, images },
}

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
