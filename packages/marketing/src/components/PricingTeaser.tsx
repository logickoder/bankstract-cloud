// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ButtonLink } from '@bankstract/ui'

import { links } from '../lib/links'
import { PAID_TIERS } from '../lib/pricing'

import { Section, SectionHeading } from './Section'

export function PricingTeaser() {
  return (
    <Section className="text-center">
      <SectionHeading>Pricing</SectionHeading>
      <p className="mx-auto mt-4 max-w-md text-fg-secondary">
        NGN monthly subscriptions from{' '}
        <span className="font-mono text-fg">{PAID_TIERS[0]!.price}</span>/mo. Self-host free,
        forever.
      </p>
      <ButtonLink href={links.pricing} variant="secondary" className="mt-8">
        See full pricing
      </ButtonLink>
    </Section>
  )
}
