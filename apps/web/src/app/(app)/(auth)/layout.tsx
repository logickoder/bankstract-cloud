// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { sections } from '@bankstract/marketing'
import { BrandMark } from '@bankstract/ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

// Auth pages carry no public content: keep them out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } }

const focusRing =
  'rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="surface-paper grid min-h-screen lg:grid-cols-2">
      <aside className="wash-paper relative hidden flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        {/* A faint statement sheet, cropped by the panel edge: the product, drawn, behind the copy. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -bottom-20 w-80 rotate-[-6deg] overflow-hidden rounded-[10px] border border-border opacity-60 shadow-sm select-none"
        >
          <sections.StatementSheet />
          <div className="scan-line absolute inset-0" />
        </div>
        <Link href="/" className={`relative flex w-fit items-center gap-2 ${focusRing}`} aria-label="bankstract home">
          <BrandMark className="h-3 w-auto text-fg" />
          <span className="font-mono text-sm font-medium text-fg">bankstract</span>
        </Link>
        <div className="relative">
          {/* Decorative marketing copy, not the page heading (the form owns the <h1>). A <p>
              keeps the visual weight without breaking the document outline. */}
          <p className="font-mono text-xs text-fg-tertiary">POST /v1/parse</p>
          <p className="mt-3 text-5xl leading-[1.04] font-normal tracking-[-0.03em] text-fg">
            Statement parsing
            <em className="block font-display font-normal italic tracking-[-0.03em] text-accent-text">
              for Nigerian banks
            </em>
          </p>
          <p className="mt-5 max-w-sm text-lg text-fg-secondary">
            Issue a key, call one endpoint, get clean transactions. NDPR-compliant redaction
            built in.
          </p>
          <div className="surface-ink mt-8 inline-block rounded-lg px-4 py-3 font-mono text-xs">
            curl -X POST /v1/parse -F &quot;pdf=@statement.pdf&quot;
          </div>
        </div>
        <span className="relative text-xs text-fg-tertiary">Open source. AGPL-3.0.</span>
      </aside>

      <main className="relative flex flex-col items-center justify-center px-6 py-16">
        <Link href="/" className={`mb-10 flex items-center gap-2 lg:hidden ${focusRing}`} aria-label="bankstract home">
          <BrandMark className="h-2.5 w-auto text-fg" />
          <span className="font-mono text-sm font-medium text-fg">bankstract</span>
        </Link>
        {children}
      </main>
    </div>
  )
}
