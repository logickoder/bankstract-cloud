// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata, JsonLd as SchemaScript, SITE_URL } from '@bankstract/seo'

const DESCRIPTION =
  'Convert a Nigerian bank statement PDF into clean transactions in your browser. No signup, no storage, processed in memory. Free, by the bankstract parsing API.'

export const metadata = buildMetadata({
  title: 'bankstract: drop your bank statement, get clean transactions',
  description: DESCRIPTION,
  path: '/demo',
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
  url: `${SITE_URL}/demo`,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'NGN' },
}

export function JsonLd() {
  return <SchemaScript data={jsonLd} />
}
