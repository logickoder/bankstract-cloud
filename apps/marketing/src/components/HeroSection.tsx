// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Button } from '@bankstract/ui'

import { HERO_CURL } from '../lib/code-samples'
import { links } from '../lib/links'

import { CodeBlock } from './CodeBlock'

export function HeroSection() {
  return (
    <section className="hero-glow">
      <div className="mx-auto grid w-full max-w-5xl gap-12 px-6 pt-24 pb-20 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-fg sm:text-6xl">
            Statement parsing API
            <span className="block font-light text-fg-secondary">for Nigerian banks</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-fg-secondary">
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
          <p className="mt-6 text-sm text-fg-tertiary">
            Open source. Self-host. Or use our cloud.
          </p>
        </div>
        <div className="lg:justify-self-end lg:pl-8">
          <CodeBlock code={HERO_CURL} lang="bash" />
          <p className="mt-3 text-xs text-fg-tertiary">
            Full reference in the <Anchor href={links.docs}>docs</Anchor>.
          </p>
        </div>
      </div>
    </section>
  )
}
