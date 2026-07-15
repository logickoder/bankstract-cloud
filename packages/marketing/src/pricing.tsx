// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata } from '@bankstract/seo'
import { Anchor, cn } from '@bankstract/ui'

import { FinalCtaSection } from './components/FinalCtaSection'
import { Footer } from './components/Footer'
import { PricingSection } from './components/PricingSection'
import { PAGE_CONTAINER } from './components/Section'

export const pricingMetadata = buildMetadata({
  title: 'Pricing',
  description:
    'NGN monthly subscription tiers for the bankstract statement parsing API. Free self-host and demo tiers, paid tiers with parse caps and overage.',
  path: '/pricing',
  keywords: ['bankstract pricing', 'statement parsing API pricing', 'NGN subscription'],
})

export function PricingPage() {
  return (
    <main>
      <div className={cn(PAGE_CONTAINER, 'pt-8')}>
        <Anchor href="/">← bankstract</Anchor>
      </div>
      <PricingSection />
      <FinalCtaSection />
      <Footer />
    </main>
  )
}
