// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata, JsonLd, SITE_URL } from '@bankstract/seo'

import { BackToHome } from './components/BackToHome'
import { FinalCtaSection } from './components/FinalCtaSection'
import { Footer } from './components/Footer'
import { PricingSection } from './components/PricingSection'
import { PAID_TIERS } from './lib/pricing'

export const pricingMetadata = buildMetadata({
  title: 'Pricing',
  description:
    'NGN monthly subscription tiers for the bankstract statement parsing API. Free self-host and demo tiers, paid tiers with parse caps and overage.',
  path: '/pricing',
  keywords: ['bankstract pricing', 'statement parsing API pricing', 'NGN subscription'],
})

// Product + per-tier Offer, so search engines can surface prices. Prices are derived from the
// same PAID_TIERS the page renders (Directive 6), stripped to a bare number for schema.org.
const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'bankstract statement parsing API',
  description:
    'Parse Nigerian bank statement PDFs into clean transactions over one API call. NGN monthly subscriptions.',
  brand: { '@type': 'Brand', name: 'bankstract' },
  offers: PAID_TIERS.map((t) => ({
    '@type': 'Offer',
    name: t.name,
    price: t.price.replace(/[^\d]/g, ''),
    priceCurrency: 'NGN',
    url: `${SITE_URL}/pricing`,
  })),
}

export function PricingPage() {
  return (
    <main>
      <JsonLd data={pricingJsonLd} />
      <BackToHome />
      <PricingSection />
      <FinalCtaSection />
      <Footer />
    </main>
  )
}
