// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Button, cn } from '@bankstract/ui'

import { HERO_CURL } from '../lib/code-samples'
import { links } from '../lib/links'

import { CodeBlock } from './CodeBlock'
import { PAGE_CONTAINER } from './Section'

export function HeroSection() {
  return (
    <section className="hero-glow relative">
      <div className="grain-section" aria-hidden="true" />
      <div
        className={cn(
          'relative grid gap-6 pt-12 pb-20 sm:gap-12 sm:pt-24 sm:pb-40 lg:grid-cols-2 lg:items-center',
          PAGE_CONTAINER,
        )}
      >
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-6xl sm:leading-[1] sm:tracking-[-0.04em] lg:text-7xl">
            Statement parsing API
            <span className="block font-light tracking-[-0.04em] text-fg-secondary sm:tracking-[-0.05em]">
              for Nigerian banks
            </span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-fg-secondary sm:text-xl">
            Drop in one API call. Get clean transactions, account metadata, NDPR-compliant
            redaction.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={links.demo}>
              <Button variant="primary">Try the demo</Button>
            </a>
            <a href={links.docs}>
              <Button variant="secondary">Read the docs</Button>
            </a>
            <a href={links.signin}>
              <Button variant="ghost">Sign in</Button>
            </a>
          </div>
          <p className="mt-6 text-sm text-fg-tertiary">Open source. Self-host. Cloud-hosted.</p>
        </div>
        <div className="min-w-0 lg:justify-self-end lg:pl-8">
          <CodeBlock code={HERO_CURL} lang="bash" />
          <p className="mt-3 text-xs text-fg-tertiary">
            Full reference in the <Anchor href={links.docs}>docs</Anchor>.
          </p>
        </div>
      </div>
    </section>
  )
}
