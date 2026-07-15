// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Card, ParseIcon, ReconcileIcon, RedactIcon } from '@bankstract/ui'
import type { ReactElement, SVGProps } from 'react'

import { Section, SectionHeading } from './Section'

type IconType = (props: SVGProps<SVGSVGElement>) => ReactElement

// Parse is the core capability, rendered as the dominant cell; Redact + Reconcile stack in a
// narrower supporting column (DESIGN: custom asymmetric grid, NOT a 3-equal-card row).
const PARSE = {
  icon: ParseIcon,
  title: 'Parse',
  body: 'Bank PDF in, structured JSON out. Transactions, balances, and account metadata, fully typed. One endpoint, the same contract every time.',
}

// Synthetic sample (FOO / ACME, fixture rule) of the shape a parse returns. Fills the dominant
// cell with the actual payload instead of dead space.
const PARSE_SAMPLE = `{
  "account": "ACME LTD ****1234",
  "transactions": [
    { "date": "2026-06-01", "narration": "Transfer FOO", "amount": 250.00 },
    { "date": "2026-06-02", "narration": "POS ACME", "amount": -40.00 }
  ]
}`

const SUPPORTING: readonly { icon: IconType; title: string; body: string }[] = [
  {
    icon: RedactIcon,
    title: 'Redact',
    body: 'NDPR-aware redaction in the same call. Names, account numbers, and BVN masked in place.',
  },
  {
    icon: ReconcileIcon,
    title: 'Reconcile',
    body: 'Every parse runs a balance check. Totals that do not line up fail loud, never silent.',
  },
]

export function FeatureGrid() {
  return (
    <Section grain>
      <SectionHeading>What you get</SectionHeading>
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex min-w-0 flex-col">
          <PARSE.icon className="size-9 text-accent" />
          <h3 className="mt-6 font-display text-3xl font-semibold text-fg">{PARSE.title}</h3>
          <p className="mt-3 max-w-md text-fg-secondary">{PARSE.body}</p>
          <pre className="mt-8 min-w-0 overflow-x-auto rounded-md border border-border bg-bg-tertiary p-4 font-mono text-xs leading-relaxed text-fg-secondary">
            {PARSE_SAMPLE}
          </pre>
        </Card>
        <div className="grid gap-4">
          {SUPPORTING.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <Icon className="size-6 text-accent" />
              <h3 className="mt-4 font-display text-2xl font-semibold text-fg">{title}</h3>
              <p className="mt-2 text-sm text-fg-secondary">{body}</p>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}
