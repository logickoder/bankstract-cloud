// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'

import { ROADMAP_BANKS, SHIPPED_BANKS } from '../lib/banks'
import type { BankEntry } from '../lib/banks'
import { links } from '../lib/links'

import { Section, SectionHeading } from './Section'

// Renders from lib/banks.ts, never a list in the component (Directive 6): the live tiles are the
// engine's parsers, the roadmap is the public one. Status is a text chip, never color alone.
const TINTS = ['bg-tint-1', 'bg-tint-2', 'bg-tint-3', 'bg-tint-4'] as const

const CHIP: Record<BankEntry['status'], string> = {
  shipped: 'bg-sheet-ink text-sheet',
  next: 'border border-fg-secondary text-fg',
  planned: 'border border-dashed border-fg-tertiary text-fg-secondary',
}

const LABEL: Record<BankEntry['status'], string> = {
  shipped: 'live',
  next: 'next',
  planned: 'planned',
}

function Chip({ status }: { status: BankEntry['status'] }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 font-mono text-xs', CHIP[status])}>
      {LABEL[status]}
    </span>
  )
}

export function BankCoverage() {
  const next = ROADMAP_BANKS.filter((bank) => bank.status === 'next').length
  const planned = ROADMAP_BANKS.length - next
  return (
    <Section>
      <SectionHeading>Reads Naija banks first</SectionHeading>
      <p className="mt-3 max-w-xl text-fg-secondary">
        {SHIPPED_BANKS.length} banks parse today. {next} are next. {planned} are planned. The
        roadmap is public. If a live bank changes its layout, the fix ships within 48h.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHIPPED_BANKS.map((bank, i) => (
          <li
            key={bank.id}
            className={cn(
              'flex min-h-36 min-w-0 flex-col items-start justify-between rounded-lg p-5 text-sheet-ink',
              TINTS[i % TINTS.length],
            )}
          >
            <Chip status={bank.status} />
            <span className="truncate font-mono text-3xl tracking-[-0.04em] sm:text-4xl">
              {bank.id}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-border bg-bg-secondary px-5 py-4">
          {ROADMAP_BANKS.map((bank) => (
            <li key={bank.id} className="flex items-center gap-3">
              <span className="font-mono text-sm text-fg-secondary">{bank.id}</span>
              <Chip status={bank.status} />
            </li>
          ))}
        </ul>
        <a
          href={links.sponsoredBank}
          className="flex items-center justify-center rounded-lg border border-dashed border-fg-tertiary px-5 py-4 text-sm font-medium text-fg transition-colors hover:border-fg hover:bg-bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          Your bank here? Sponsor the parser
        </a>
      </div>
    </Section>
  )
}
