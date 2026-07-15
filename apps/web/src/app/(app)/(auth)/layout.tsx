// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BrandMark } from '@bankstract/ui'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Auth pages carry no public content: keep them out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hero-glow relative hidden flex-col justify-between overflow-hidden border-r border-border bg-bg-secondary p-12 lg:flex">
        <div className="grain-section" aria-hidden="true" />
        <span className="relative flex items-center gap-2 font-display text-xl font-bold text-fg">
          <BrandMark className="h-3 w-auto" />
          bankstract
        </span>
        <div className="relative">
          {/* Decorative marketing copy, not the page heading (the form owns the <h1>). A <p>
              keeps the visual weight without breaking the document outline. */}
          <p className="font-display text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-fg">
            Statement parsing API
            <span className="block font-light text-fg-secondary">for Nigerian banks</span>
          </p>
          <p className="mt-4 max-w-sm text-fg-secondary">
            Issue a key, call one endpoint, get clean transactions. NDPR-compliant redaction
            built in.
          </p>
          <div className="mt-6 inline-block rounded-md border border-bg-tertiary bg-bg-tertiary px-3 py-2 font-mono text-xs text-fg-secondary">
            curl -X POST /v1/parse -F &quot;pdf=@statement.pdf&quot;
          </div>
        </div>
        <span className="relative text-xs text-fg-tertiary">Open source. AGPL-3.0.</span>
      </aside>

      <main className="relative flex flex-col items-center justify-center px-6 py-16">
        <span className="mb-10 flex items-center gap-2 font-display text-lg font-bold text-fg lg:hidden">
          <BrandMark className="h-2.5 w-auto" />
          bankstract
        </span>
        {children}
      </main>
    </div>
  )
}
