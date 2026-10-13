// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Section, SectionHeading } from './Section'
import { FailLoudCompare } from './fail-loud-compare'

const RULES: readonly { display: string; title: string; body: string }[] = [
  {
    display: '422',
    title: 'Totals must match',
    body: 'Row balances are checked against the statement totals. If they do not add up, the API refuses the statement and says why.',
  },
  {
    display: 'format_version',
    title: 'Layout drift gets a name',
    body: 'When a bank changes its statement layout, the error says which layout version failed. Rows never drop silently.',
  },
  {
    display: '0 B',
    title: 'Nothing touches disk',
    body: 'PDF bytes stay in memory. No temp files. No disk writes. Dropped when the response ends.',
  },
]

// Failure modes (SHINE-style ruled numerals under a BENKUY-style contrast). Display type is the
// proof; the wire shapes live in the docs.
export function FailLoud() {
  return (
    <Section surface="raised">
      <SectionHeading>Fails loud.</SectionHeading>
      <p className="mt-3 mb-10 max-w-xl text-xl text-fg">
        A wrong number that looks right is the worst result. bankstract stops instead.
      </p>
      <FailLoudCompare />
      <dl className="mt-3 grid gap-3 lg:grid-cols-3">
        {RULES.map((rule) => (
          <div
            key={rule.title}
            className="flex min-w-0 flex-col rounded-lg border border-border bg-bg p-6 sm:p-8"
          >
            <dt className="font-mono text-3xl tracking-[-0.04em] text-fg lg:text-[clamp(1.4rem,1.9vw,2rem)] lg:whitespace-nowrap">
              {rule.display}
            </dt>
            <dd className="mt-6">
              <p className="font-display text-xl font-semibold tracking-[-0.02em] text-fg">
                {rule.title}
              </p>
              <p className="mt-2 text-sm text-fg-secondary">{rule.body}</p>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
