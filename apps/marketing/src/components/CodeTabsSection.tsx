// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { CODE_SAMPLES } from '../lib/code-samples'

import { CodeBlock } from './CodeBlock'
import { Section, SectionHeading } from './Section'
import { Tabs } from './Tabs'

// Server pre-renders one highlighted CodeBlock per language; Tabs (client) toggles them.
export function CodeTabsSection() {
  const items = CODE_SAMPLES.map((sample) => ({
    label: sample.label,
    panel: <CodeBlock code={sample.code} lang={sample.lang} />,
  }))
  return (
    <Section>
      <SectionHeading>Integrate today</SectionHeading>
      <p className="mt-3 mb-8 max-w-xl text-fg-secondary">
        One endpoint. Your language. Same JSON contract every time.
      </p>
      <Tabs items={items} />
    </Section>
  )
}
