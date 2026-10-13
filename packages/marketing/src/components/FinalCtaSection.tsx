// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ButtonLink } from '@bankstract/ui'

import { links } from '../lib/links'
import { PAID_TIERS } from '../lib/pricing'

import { Section, SectionHeading } from './Section'

const LINK =
  'rounded-sm underline underline-offset-4 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sheet-ink focus-visible:outline'

// Closing full-bleed peach band (DESIGN surfaces.peach). The ink button is the primary action.
export function FinalCtaSection() {
  return (
    <Section surface="peach" className="py-16 text-center sm:py-24">
      <SectionHeading>Parse your first statement</SectionHeading>
      <p className="mx-auto mt-4 max-w-md">
        Free demo, no signup. Self-host the whole stack, or use the cloud from{' '}
        <span className="font-mono">{PAID_TIERS[0]!.price}</span>/mo.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href={links.signup} variant="solid">
          Get started free
        </ButtonLink>
        <ButtonLink
          href={links.pricing}
          variant="secondary"
          className="border-sheet-ink/50 text-sheet-ink hover:border-sheet-ink hover:bg-sheet-ink/10"
        >
          See pricing
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm">
        Prefer your own box?{' '}
        <a href={links.selfHost} className={LINK}>
          Self-host
        </a>
        . Need volume or NDPR audit support?{' '}
        <a href={links.sales} className={LINK}>
          Talk to sales
        </a>
        .
      </p>
    </Section>
  )
}
