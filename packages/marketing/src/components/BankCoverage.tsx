// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ALL_BANKS, SHIPPED_BANKS } from '../lib/banks'

import { BankCoverageCell } from './BankCoverageCell'
import { Section, SectionHeading } from './Section'

export function BankCoverage() {
  return (
    <Section>
      <SectionHeading>Reads Naija banks first</SectionHeading>
      <p className="mt-3 max-w-xl text-fg-secondary">
        {SHIPPED_BANKS.length} banks parse today. The rest are on the roadmap, in the open.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ALL_BANKS.map((entry) => (
          <BankCoverageCell key={entry.id} entry={entry} />
        ))}
      </div>
      <p className="mt-6 text-sm text-fg-tertiary">Format drift fixed in 48h.</p>
    </Section>
  )
}
