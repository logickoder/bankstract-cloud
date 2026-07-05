// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Badge, Button, linkClass } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section, SectionHeading } from './Section'

export function OssPrideSection() {
  return (
    <Section className="text-center">
      <SectionHeading>We&apos;re open source. AGPL-3.0.</SectionHeading>
      <p className="mx-auto mt-4 max-w-xl text-fg-secondary">
        The cloud layer and the engine are both public. Run the whole stack yourself with
        docker-compose. No license fee, no lock-in.
      </p>
      {/* DESIGN oss-pride stats. Live star/contributor counts are deferred: a new repo
          showing a low count is a weak signal. License badge + a star CTA carry the trust. */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
        <Badge tone="accent">AGPL-3.0</Badge>
        <a href={links.cloud} className={linkClass}>
          Star on GitHub
        </a>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={links.selfHost}>
          <Button variant="primary">Self-host with docker-compose</Button>
        </a>
        <a href={links.cloud}>
          <Button variant="ghost">View source</Button>
        </a>
      </div>
      <p className="mt-6 text-sm text-fg-tertiary">
        Need a bank added?{' '}
        <Anchor href={links.sponsoredBank}>Sponsor the implementation.</Anchor>
      </p>
      <p className="mt-2 text-sm text-fg-tertiary">
        Built by <Anchor href={links.owner}>logickoder</Anchor>.
      </p>
    </Section>
  )
}
