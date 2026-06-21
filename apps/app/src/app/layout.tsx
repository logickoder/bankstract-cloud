// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { GrainFilter } from '@bankstract/ui'
import { fraunces, inter, jetbrains } from '@bankstract/ui/fonts'
import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: 'bankstract dashboard',
  description: 'API keys, usage, and billing for the bankstract statement parsing API.',
}

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
