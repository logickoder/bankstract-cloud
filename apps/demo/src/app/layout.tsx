// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { Metadata } from 'next'

import { fraunces, inter, jetbrains } from '../lib/fonts'

import './globals.css'

export const metadata: Metadata = {
  title: 'bankstract — drop your bank statement',
  description: 'PDF in, clean transactions out. Personal use. No signup. No storage.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <svg className="absolute h-0 w-0" aria-hidden="true">
          <filter id="bs-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={4}
              stitchTiles="stitch"
            />
          </filter>
        </svg>
        <div className="grain" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
