// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata, SITE_URL } from '@bankstract/seo'

const DESCRIPTION =
  'Parse Nigerian bank statement PDFs into clean transactions and account metadata over one API call. NDPR-compliant redaction. Open source, AGPL-3.0. Built for fintechs.'

export const metadata = buildMetadata({
  title: 'bankstract: bank statement parsing API for Nigerian banks',
  description: DESCRIPTION,
  keywords: [
    'bank statement parsing',
    'Nigerian banks',
    'statement API',
    'PDF parsing',
    'fintech',
    'NDPR',
    'transactions API',
    'bank statement to CSV',
  ],
})

// Organization + SoftwareApplication for rich results. The OSS engine is the trust signal.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'bankstract',
      url: SITE_URL,
    },
    {
      '@type': 'Organization',
      name: 'bankstract',
      url: SITE_URL,
      sameAs: ['https://github.com/logickoder/bankstract-cloud', 'https://logickoder.dev'],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'bankstract',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      description: DESCRIPTION,
      url: SITE_URL,
      offers: {
        '@type': 'Offer',
        price: '9500',
        priceCurrency: 'NGN',
        description: 'Starter tier, monthly. Free demo + self-host available.',
      },
    },
  ],
}

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
