// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section } from './Section'

// The page's editorial beat (DESIGN §anti-ai-required): asymmetric split, a dropped lead, mixed
// type sizes on the left; a dense mono-numbered ledger of guarantees on the right.
const GUARANTEES: readonly string[] = [
  'NDPR-aware redaction in one API call.',
  'Ephemeral processing. We never write your PDF to disk.',
  'Audit log is metadata only. Filename and byte count, never contents.',
  'Source on GitHub. Verify the claims yourself.',
  'On-prem option. Run the MIT engine on your own infrastructure instead.',
]

export function ComplianceSection() {
  return (
    <Section surface="raised">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Compliance</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
            NDPR by default.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-fg-secondary first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.7] first-letter:font-bold first-letter:text-fg">
            Privacy is the product. Statements are parsed in memory and dropped. The audit log keeps
            metadata, never contents. Every claim is verifiable in the open source.
          </p>
          <p className="mt-6 text-sm text-fg-tertiary">
            Read the <Anchor href={links.security}>security policy</Anchor> or{' '}
            <Anchor href={links.engine}>run the MIT engine on-prem</Anchor>.
          </p>
        </div>

        <ol className="flex flex-col divide-y divide-border border-y border-border">
          {GUARANTEES.map((g, i) => (
            <li key={g} className="flex items-baseline gap-4 py-4">
              <span className="font-mono text-sm text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm text-fg-secondary">{g}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
