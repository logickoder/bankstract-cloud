// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { linkClass } from '@bankstract/ui'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl font-bold tracking-tight text-fg sm:text-5xl">404</h1>
      <p className="text-fg-secondary">
        No statement here. This page was never parsed into existence.
      </p>
      <Link className={linkClass} href="/">
        Back to the demo
      </Link>
    </main>
  )
}
