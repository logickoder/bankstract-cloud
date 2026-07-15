// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor } from '@bankstract/ui'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">404</p>
      <h1 className="font-display text-4xl font-bold tracking-tight text-fg sm:text-5xl">
        No parser for this page.
      </h1>
      <p className="max-w-md text-fg-secondary">
        The statement you asked for is not here. Check the URL, or head back and start over.
      </p>
      <Anchor href="/">Back to bankstract</Anchor>
    </main>
  )
}
