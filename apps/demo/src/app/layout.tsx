// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata, SITE_URL } from '@bankstract/seo'
import { GrainFilter } from '@bankstract/ui'
import { fraunces, inter, jetbrains } from '@bankstract/ui/fonts'

import './globals.css'

const DESCRIPTION =
  'Convert a Nigerian bank statement PDF into clean transactions in your browser. No signup, no storage, processed in memory. Free, by the bankstract parsing API.'

export const metadata = buildMetadata({
  title: 'bankstract: drop your bank statement, get clean transactions',
  description: DESCRIPTION,
  keywords: [
    'bank statement to CSV',
    'convert bank statement PDF',
    'Nigerian bank statement',
    'PDF to transactions',
    'statement parser',
  ],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'bankstract demo',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: DESCRIPTION,
  url: SITE_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GrainFilter />
        <div className="grain-fixed" aria-hidden="true" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
