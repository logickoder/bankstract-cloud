// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section, SectionHeading } from './Section'

const BULLETS: readonly string[] = [
  'NDPR-aware redaction in one API call.',
  'Ephemeral processing. We never write your PDF to disk.',
  'Audit log is metadata only. Filename and byte count, never contents.',
  'Source on GitHub. Verify the claims yourself.',
]

export function ComplianceSection() {
  return (
    <Section>
      <SectionHeading>Built for compliance</SectionHeading>
      <ul className="mt-8 flex flex-col gap-3">
        {BULLETS.map((b) => (
          <li key={b} className="flex gap-3 text-fg-secondary">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            {b}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-fg-tertiary">
        Read the <Anchor href={links.security}>security policy</Anchor>.
      </p>
    </Section>
  )
}
