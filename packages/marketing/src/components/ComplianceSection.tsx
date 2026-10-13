// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section } from './Section'

// The path a statement takes, one claim per step. Each is backed by the worker: held in memory
// (BytesIO), read in the engine's child over a pipe with no temp file (tests/test_isolation.py),
// returned in the response, dropped when it ends, audit row is metadata only (docs/rules/privacy.md).
const STEPS: readonly { title: string; body: string }[] = [
  { title: 'In', body: 'The PDF arrives in the request and is held in memory.' },
  { title: 'Read', body: 'A child process reads it over a pipe. No temp file.' },
  { title: 'Out', body: 'Rows, or the redacted file, go back in the same response.' },
  { title: 'Dropped', body: 'The bytes are dropped when the response ends.' },
  { title: 'Logged', body: 'The audit log keeps filename and byte count. Never contents.' },
]

const LINK = 'text-sheet-ink underline'

export function ComplianceSection() {
  return (
    <Section surface="lilac" className="py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-sheet-ink/70">Compliance</p>
      <h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">
        NDPR by default.
      </h2>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sheet-ink/80 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.7] first-letter:font-bold first-letter:text-sheet-ink">
        Privacy is the product. Statements are parsed in memory and dropped. NDPR-aware redaction
        runs in the same API call. Every claim is verifiable in the open source.
      </p>

      <ol className="mt-12 grid gap-8 border-l border-dashed border-sheet-ink/40 pl-6 lg:grid-cols-5 lg:gap-6 lg:border-t lg:border-l-0 lg:pt-8 lg:pl-0">
        {STEPS.map((step, i) => (
          <li key={step.title} className="relative min-w-0">
            <span
              aria-hidden="true"
              className="absolute top-1 -left-[1.9rem] size-3 rounded-full bg-sheet-ink lg:top-[-2.35rem] lg:left-0"
            />
            <p className="font-mono text-xs text-sheet-ink/70">{String(i + 1).padStart(2, '0')}</p>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-sheet-ink/80">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-sm text-sheet-ink/70">
        Read the <Anchor className={LINK} href={links.security}>security policy</Anchor>, check the{' '}
        <Anchor className={LINK} href={links.cloud}>source on GitHub</Anchor>, or{' '}
        <Anchor className={LINK} href={links.engine}>run the MIT engine on your own infrastructure</Anchor>.
      </p>
    </Section>
  )
}
