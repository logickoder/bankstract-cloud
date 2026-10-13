// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ButtonLink, cn, Tile } from '@bankstract/ui'

import { links } from '../lib/links'
import { ANNUAL_NOTE, ENTERPRISE, FREE_TIERS, type PaidTier, PAID_TIERS } from '../lib/pricing'

import { Section } from './Section'

// One dominant recommended tier carries the decision (DESIGN §ai-slop: never three equal cards).
// Each paid tier gets its own pastel (`tint` in lib/pricing.ts). Figures render from there too.

const featured = PAID_TIERS.find((t) => t.highlight)
const rail = PAID_TIERS.filter((t) => !t.highlight)

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2.5">
      <dt className="text-sm text-fg-tertiary">{label}</dt>
      <dd className="text-right font-mono text-sm text-fg">{value}</dd>
    </div>
  )
}

export function PricingSection() {
  return (
    <Section id="pricing" className="pt-10 sm:pt-14">
      <p className="font-mono text-xs tracking-[0.2em] text-fg-tertiary uppercase">Pricing</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.1] font-bold tracking-[-0.03em] sm:text-[48px]">
        Pay in naira. Pay per month.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-fg-secondary">
        Each tier has a monthly parse cap. {ANNUAL_NOTE} Failed parses are never counted or billed.
      </p>

      <div className="mt-10 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        {featured ? (
          <Tile tint={featured.tint}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                {featured.name}
              </h2>
              <span className="rounded-full bg-fg px-3 py-1 font-mono text-xs text-bg">
                popular
              </span>
            </div>
            <p className="mt-6">
              <span className="font-mono text-5xl tracking-[-0.04em] sm:text-6xl">
                {featured.price}
              </span>
              <span className="text-sm text-fg-tertiary">/mo</span>
            </p>
            <dl className="mt-8 mb-8">
              <SpecRow label="Included" value={featured.cap} />
              <SpecRow label="Overage" value={featured.overage} />
              <SpecRow label="Support" value={featured.sla} />
            </dl>
            <ButtonLink href={links.signup} variant="solid" className="mt-auto w-full sm:w-auto sm:self-start">
              Subscribe to {featured.name}
            </ButtonLink>
          </Tile>
        ) : null}

        <div className="grid gap-3">
          {rail.map((tier) => (
            <RailTier key={tier.name} tier={tier} />
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.35fr]">
        {FREE_TIERS.map((t) => (
          <Tile key={t.name} className="gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">{t.name}</h2>
              <span className="font-mono text-lg">₦0</span>
            </div>
            <p className="text-sm text-fg-secondary">{t.detail}</p>
          </Tile>
        ))}
        <Tile className="gap-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">
              {ENTERPRISE.name}
            </h2>
            <span className="font-mono text-sm">{ENTERPRISE.band}</span>
          </div>
          <p className="text-sm text-fg-secondary">{ENTERPRISE.detail}</p>
          <ButtonLink href={links.sales} variant="secondary" className="mt-3 self-start">
            Talk to sales
          </ButtonLink>
        </Tile>
      </div>

      <p className="mt-8 max-w-2xl text-sm text-fg-tertiary">
        Parses beyond the cap are billed as overage at the end of the cycle, at the rate shown on
        each tier. An inactive subscription stops live keys with a 402.
      </p>
    </Section>
  )
}

function RailTier({ tier }: { tier: PaidTier }) {
  return (
    <Tile tint={tier.tint} className={cn('justify-between gap-5')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">{tier.name}</h2>
        <p>
          <span className="font-mono text-3xl tracking-[-0.04em]">{tier.price}</span>
          <span className="text-xs text-fg-tertiary">/mo</span>
        </p>
      </div>
      <dl>
        <SpecRow label="Included" value={tier.cap} />
        <SpecRow label="Overage" value={tier.overage} />
      </dl>
      <ButtonLink href={links.signup} variant="solid" size="sm" className="self-start">
        Subscribe to {tier.name}
      </ButtonLink>
    </Tile>
  )
}
