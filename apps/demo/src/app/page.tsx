// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { DemoClient } from '../components/DemoClient'
import { LINK_CLASS } from '../lib/styles'

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-10 px-6 py-20">
      <header className="text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight text-fg">
          Drop your bank statement
        </h1>
        <p className="mt-4 text-lg text-fg-secondary">
          PDF in, clean transactions out. Personal use. No signup. No storage.
        </p>
      </header>

      <DemoClient />

      <div className="text-center text-sm text-fg-tertiary">
        <p>
          For production use, see the{' '}
          <a className={LINK_CLASS} href="/docs">
            API docs
          </a>
          .
        </p>
        <p className="mt-1">
          Don&apos;t trust us? Self-host with{' '}
          <a className={LINK_CLASS} href="https://github.com/logickoder/bankstract">
            the engine
          </a>
          .
        </p>
      </div>

      <footer className="mt-12 flex flex-col items-center gap-3 text-center text-xs text-fg-tertiary">
        <p>Built in Lagos. Every Nigerian dev has parsed a bank PDF by hand once.</p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <a className="hover:text-fg-secondary" href="https://github.com/logickoder/bankstract">
            Engine
          </a>
          <a
            className="hover:text-fg-secondary"
            href="https://github.com/logickoder/bankstract-cloud/blob/main/infra/README.md"
          >
            Self-host
          </a>
          <a
            className="hover:text-fg-secondary"
            href="https://github.com/logickoder/bankstract-cloud/blob/main/SECURITY.md"
          >
            Security
          </a>
          <a className="text-accent hover:underline" href="https://github.com/logickoder">
            logickoder
          </a>
        </nav>
      </footer>
    </main>
  )
}
