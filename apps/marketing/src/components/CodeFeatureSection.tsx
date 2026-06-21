// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { CodeBlock } from './CodeBlock'
import { Section, SectionHeading } from './Section'

interface CodeFeature {
  title: string
  body: string
  code: string
  lang: string
}

const FEATURES: readonly CodeFeature[] = [
  {
    title: 'Reconciliation invariant',
    body: 'Every parse checks row balances against the statement totals. A mismatch returns a 422, not a wrong number.',
    lang: 'json',
    code: `{ "error_class": "ReconciliationError",
  "error": "row totals do not match header" }`,
  },
  {
    title: 'Format-version drift detection',
    body: 'When a bank changes its layout, you get an explicit error with the format version, never a silent dropout.',
    lang: 'json',
    code: `{ "error_class": "LayoutDriftError",
  "format_version": "zenith-2025-11" }`,
  },
  {
    title: 'Stream input',
    body: 'PDF bytes flow through memory. No temp files, no disk writes, BytesIO end to end.',
    lang: 'python',
    code: `buf = io.BytesIO(await pdf.read())
result = bankstract.parse(buf)`,
  },
]

export function CodeFeatureSection() {
  return (
    <Section>
      <SectionHeading>Reliable by default</SectionHeading>
      <div className="mt-10 flex flex-col gap-12">
        {FEATURES.map((f) => (
          <div key={f.title} className="grid items-center gap-6 lg:grid-cols-2">
            <CodeBlock code={f.code} lang={f.lang} />
            <div>
              <h3 className="font-medium text-fg">{f.title}</h3>
              <p className="mt-2 text-fg-secondary">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}
