// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Card } from '@bankstract/ui'
import { FileText, Scale, ShieldOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Section, SectionHeading } from './Section'

interface Feature {
  icon: LucideIcon
  title: string
  body: string
}

const FEATURES: readonly Feature[] = [
  {
    icon: FileText,
    title: 'Parse',
    body: 'Bank PDF in, structured JSON out. Transactions, balances, account metadata, typed.',
  },
  {
    icon: ShieldOff,
    title: 'Redact',
    body: 'NDPR-aware redaction in the same call. Names, account numbers, and BVN masked in place.',
  },
  {
    icon: Scale,
    title: 'Reconcile',
    body: 'Every parse runs a balance check. Totals that do not line up fail loud, never silent.',
  },
]

export function FeatureGrid() {
  return (
    <Section>
      <SectionHeading>What you get</SectionHeading>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <Icon className="size-6 text-accent" aria-hidden="true" />
            <h3 className="mt-4 font-medium text-fg">{title}</h3>
            <p className="mt-2 text-sm text-fg-secondary">{body}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
