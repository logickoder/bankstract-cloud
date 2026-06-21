// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Button, Card, cn } from '@bankstract/ui'

import { links } from '../lib/links'
import { ANNUAL_NOTE, ENTERPRISE, FREE_TIERS, PAID_TIERS } from '../lib/pricing'

import { Section, SectionHeading } from './Section'

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

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {PAID_TIERS.map((t) => (
          <Card
            key={t.name}
            className={cn(
              'flex flex-col transition duration-200 hover:-translate-y-1',
              t.highlight && 'border-accent',
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-fg">{t.name}</h3>
              {t.highlight ? <span className="text-xs text-accent">Popular</span> : null}
            </div>
            <p className="mt-3">
              <span className="font-mono text-3xl text-fg">{t.price}</span>
              <span className="text-sm text-fg-tertiary">/mo</span>
            </p>
            <dl className="mt-4 flex flex-col gap-2 text-sm text-fg-secondary">
              <div className="flex justify-between">
                <dt>Included</dt>
                <dd className="font-mono text-fg">{t.cap}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Overage</dt>
                <dd className="font-mono text-fg">{t.overage}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Support</dt>
                <dd className="text-right text-fg">{t.sla}</dd>
              </div>
            </dl>
            <a href={links.waitlist} className="mt-auto pt-6">
              <Button variant={t.highlight ? 'primary' : 'secondary'} className="w-full">
                Notify me on launch
              </Button>
            </a>
          </Card>
        ))}
      </div>

      <Card className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-fg">{ENTERPRISE.name}</h3>
          <p className="mt-1 text-sm text-fg-secondary">{ENTERPRISE.detail}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-fg">{ENTERPRISE.band}</span>
          <a href={links.sales}>
            <Button variant="ghost">Talk to sales</Button>
          </a>
        </div>
      </Card>
    </Section>
  )
}
