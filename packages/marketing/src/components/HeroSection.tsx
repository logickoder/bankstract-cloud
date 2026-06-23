// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Button } from '@bankstract/ui'

import { HERO_CURL } from '../lib/code-samples'
import { links } from '../lib/links'

import { CodeBlock } from './CodeBlock'

export function HeroSection() {
  return (
    <section className="hero-glow relative">
      <div className="grain-section" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-5xl gap-12 px-6 pt-24 pb-40 lg:grid-cols-2 lg:items-center">
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-6xl sm:leading-[1] sm:tracking-[-0.04em] lg:text-7xl">
            Statement parsing API
            <span className="block font-light tracking-[-0.04em] text-fg-secondary sm:tracking-[-0.05em]">
              for Nigerian banks
            </span>
          </h1>
          <p className="mt-6 max-w-md text-xl text-fg-secondary">
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
