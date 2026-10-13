// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ButtonLink, linkClass } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section, SectionHeading } from './Section'
import { StackGraphic } from './graphics'

// Left-heavy and tiled like the rest of the page. The licence is the display type, and the line
// B2B buyers look for (calling the API does not make their code AGPL) sits in the tile, per
// docs/rules/license.md. Live star and contributor counts are deferred: a new repo showing a low
// count is a weak signal, so a star link carries it.
export function OssPrideSection() {
  return (
    <Section>
      <SectionHeading>We&apos;re open source.</SectionHeading>
      <div className="mt-8 grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div className="flex min-w-0 flex-col rounded-lg bg-tint-2 p-6 text-sheet-ink sm:p-8">
          <p className="font-mono text-xs text-sheet-ink/70">license</p>
          <p className="mt-3 font-display text-6xl font-bold tracking-[-0.04em] sm:text-7xl">
            AGPL-3.0
          </p>
          <p className="mt-5 max-w-md text-sheet-ink/80">
            The cloud layer and the engine are both public. Run the whole stack yourself. No license
            fee, no lock-in.
          </p>
          <p className="mt-3 max-w-md text-sm text-sheet-ink/70">
            Call the API over HTTP and your code does not inherit AGPL. A hosted fork must open its
            changes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={links.selfHost} variant="solid">
              Self-host with docker-compose
            </ButtonLink>
            <ButtonLink
              href={links.cloud}
              variant="secondary"
              className="border-sheet-ink/40 hover:border-sheet-ink hover:bg-sheet-ink/10"
            >
              View source
            </ButtonLink>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-6 rounded-lg border border-border bg-bg-secondary p-6 sm:p-8">
          <StackGraphic />
          <p className="text-sm text-fg-tertiary">
            The self-host bundle in <span className="font-mono">infra/</span>: the worker and a thin
            demo, on the engine.{' '}
            <a href={links.stars} className={linkClass}>
              Star on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </Section>
  )
}
