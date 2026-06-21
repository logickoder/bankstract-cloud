// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Button } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section } from './Section'

export function FinalCtaSection() {
  return (
    <Section className="text-center">
      <h2 className="font-display text-4xl font-bold tracking-tight text-fg">
        Parse your first statement
      </h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={links.signup}>
          <Button variant="primary">Get started free</Button>
        </a>
        <a href={links.selfHost}>
          <Button variant="secondary">Self-host</Button>
        </a>
      </div>
      <p className="mt-6 text-sm text-fg-tertiary">
        Need volume or NDPR audit support? <Anchor href={links.sales}>Talk to sales</Anchor>.
      </p>
    </Section>
  )
}
