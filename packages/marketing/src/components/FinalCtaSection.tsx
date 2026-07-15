// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ButtonLink, linkClass } from '@bankstract/ui'

import { links } from '../lib/links'

import { Section, SectionHeading } from './Section'

// The single inverted (warm-white) band (DESIGN single_section). ui Button secondary/ghost
// are dark-theme, so on this light surface we use the accent primary + dark text links.
export function FinalCtaSection() {
  return (
    <Section surface="inverted" className="text-center">
      <SectionHeading>Parse your first statement</SectionHeading>
      <p className="mx-auto mt-4 max-w-md text-fg-inverse/70">
        Free demo, no signup. Self-host the whole stack, or use the cloud when paid tiers ship.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href={links.signup} variant="primary">
          Get started free
        </ButtonLink>
        {/* Hand-styled for the inverted surface (ui Button secondary/ghost are dark-theme).
            focus-visible is on the fg-inverse colour so keyboard focus shows on the light band. */}
        <a
          href={links.selfHost}
          className="rounded-md border border-fg-inverse/20 px-5 py-3 text-sm font-medium text-fg-inverse transition-colors hover:border-fg-inverse/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg-inverse focus-visible:outline"
        >
          Self-host
        </a>
      </div>
      <p className="mt-6 text-sm text-fg-inverse/60">
        Need volume or NDPR audit support?{' '}
        <a href={links.sales} className={linkClass}>
          Talk to sales
        </a>
        .
      </p>
    </Section>
  )
}
