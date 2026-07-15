// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Badge, ButtonLink, linkClass } from '@bankstract/ui'

import { links } from '../lib/links'

import { CodeBlock } from './CodeBlock'
import { Section, SectionHeading } from './Section'

// Left-heavy (DESIGN ref: trigger.dev's OSS section is not centered) so the late page reads
// asymmetric instead of a run of centered CTA bands. The terminal block is the concrete proof.
const SELF_HOST = `git clone https://github.com/logickoder/bankstract-cloud
cd bankstract-cloud/infra
docker compose up --build`

export function OssPrideSection() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <SectionHeading>We&apos;re open source. AGPL-3.0.</SectionHeading>
          <p className="mt-4 max-w-md text-fg-secondary">
            The cloud layer and the engine are both public. Run the whole stack yourself with
            docker-compose. No license fee, no lock-in.
          </p>
          {/* DESIGN oss-pride stats. Live star/contributor counts are deferred: a new repo
              showing a low count is a weak signal. License badge + a star CTA carry the trust. */}
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
            <Badge tone="accent">AGPL-3.0</Badge>
            <a href={links.stars} className={linkClass}>
              Star on GitHub
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={links.selfHost} variant="primary">
              Self-host with docker-compose
            </ButtonLink>
            <ButtonLink href={links.cloud} variant="ghost">
              View source
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-fg-tertiary">
            Need a bank added?{' '}
            <Anchor href={links.sponsoredBank}>Sponsor the implementation.</Anchor>
          </p>
          <p className="mt-2 text-sm text-fg-tertiary">
            Built by <Anchor href={links.owner}>logickoder</Anchor>.
          </p>
        </div>

        <div className="min-w-0">
          <CodeBlock code={SELF_HOST} lang="bash" />
        </div>
      </div>
    </Section>
  )
}
