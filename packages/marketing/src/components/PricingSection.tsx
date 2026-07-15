// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Badge, ButtonLink, Card } from '@bankstract/ui'

import { links } from '../lib/links'
import { ANNUAL_NOTE, ENTERPRISE, FREE_TIERS, type PaidTier, PAID_TIERS } from '../lib/pricing'

import { Section, SectionHeading } from './Section'

// Not a row of three interchangeable cards (DESIGN §ai-slop). One dominant recommended tier
// carries the decision; the other paid tiers sit as a compact mono datasheet rail beside it.
const featured = PAID_TIERS.find((t) => t.highlight)
const rail = PAID_TIERS.filter((t) => !t.highlight)

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2">
      <dt className="text-sm text-fg-tertiary">{label}</dt>
      <dd className="text-right text-sm text-fg">{value}</dd>
    </div>
  )
}

export function PricingSection() {
  return (
    <Section id="pricing">
      <SectionHeading>Pricing</SectionHeading>
      <p className="mt-3 text-fg-secondary">NGN monthly subscriptions. {ANNUAL_NOTE}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {FREE_TIERS.map((t) => (
          <Card key={t.name} className="flex items-baseline justify-between gap-4">
            <div>
              <h3 className="font-medium text-fg">{t.name}</h3>
              <p className="mt-1 text-sm text-fg-secondary">{t.detail}</p>
            </div>
            <span className="font-mono text-lg text-fg">₦0</span>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {featured ? (
          <Card className="flex flex-col border-accent">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-fg">{featured.name}</h3>
              <Badge tone="accent">Popular</Badge>
            </div>
            <p className="mt-4">
              <span className="font-mono text-5xl text-fg">{featured.price}</span>
              <span className="text-sm text-fg-tertiary">/mo</span>
            </p>
            <dl className="mt-6">
              <SpecRow label="Included" value={featured.cap} />
              <SpecRow label="Overage" value={featured.overage} />
              <SpecRow label="Support" value={featured.sla} />
            </dl>
            <ButtonLink href={links.billing} variant="primary" className="mt-8 w-full">
              Subscribe
            </ButtonLink>
          </Card>
        ) : null}

        <div className="grid gap-4">
          {rail.map((t) => (
            <RailTier key={t.name} tier={t} />
          ))}
        </div>
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-fg">{ENTERPRISE.name}</h3>
          <p className="mt-1 text-sm text-fg-secondary">{ENTERPRISE.detail}</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <span className="font-mono text-sm text-fg">{ENTERPRISE.band}</span>
          <ButtonLink href={links.sales} variant="ghost">
            Talk to sales
          </ButtonLink>
        </div>
      </Card>
    </Section>
  )
}

function RailTier({ tier }: { tier: PaidTier }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium text-fg">{tier.name}</h3>
        <p>
          <span className="font-mono text-2xl text-fg">{tier.price}</span>
          <span className="text-xs text-fg-tertiary">/mo</span>
        </p>
      </div>
      <dl className="mt-3 flex flex-col gap-1.5 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-fg-tertiary">Included</dt>
          <dd className="font-mono text-fg">{tier.cap}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-fg-tertiary">Overage</dt>
          <dd className="font-mono text-fg">{tier.overage}</dd>
        </div>
      </dl>
      <ButtonLink href={links.billing} variant="secondary" size="sm" className="mt-4 w-full">
        Subscribe
      </ButtonLink>
    </Card>
  )
}
