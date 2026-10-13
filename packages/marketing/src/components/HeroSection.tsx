// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ButtonLink, cn } from '@bankstract/ui'

import { SHIPPED_BANKS } from '../lib/banks'
import { links } from '../lib/links'

import { SampleStat } from './SampleStat'
import { PAGE_CONTAINER } from './Section'
import { StatementFlow } from './StatementFlow'

// Hero: copy left, proof right (Capital layout), the sample statement flowing in underneath. On
// desktop the hero fills the viewport below the sticky header (svh minus the 4rem header) but is capped at 56rem, so tall windows don't stretch it
// into empty gaps; nothing clips at the bottom. Below lg the content stacks and takes its natural height.
export function HeroSection() {
  return (
    <section className="wash-paper relative">
      <div
        className={cn(
          'flex flex-col gap-10 py-10 sm:py-14 lg:min-h-[min(calc(100svh-4rem),56rem)] lg:justify-between lg:gap-4 lg:py-8',
          PAGE_CONTAINER,
        )}
      >
        <div>
          <p className="font-mono text-xs text-fg-tertiary">POST /v1/parse</p>
          <h1 className="mt-3 text-5xl leading-[1.04] font-normal tracking-[-0.03em] text-fg sm:text-6xl lg:text-[clamp(2.75rem,7.5svh,4.5rem)]">
            Bank PDFs in.
            <br />
            Clean{' '}
            <em className="font-display font-normal italic tracking-[-0.03em] text-accent-text">
              transactions
            </em>{' '}
            out.
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div className="min-w-0">
            <p className="max-w-lg text-lg text-fg-secondary">
              One API call. Structured transactions and balances back. If the totals don&apos;t match
              the statement, you get the reason. Never a wrong number.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={links.demo} variant="solid">
                Try the demo
              </ButtonLink>
              <ButtonLink href={links.docs} reload variant="secondary">
                Read the docs
              </ButtonLink>
            </div>
            <p className="mt-4 font-mono text-sm text-fg-tertiary">
              Live: {SHIPPED_BANKS.map((bank) => bank.id).join(', ')}
            </p>
          </div>
          <SampleStat />
        </div>

        <StatementFlow />
      </div>
    </section>
  )
}
