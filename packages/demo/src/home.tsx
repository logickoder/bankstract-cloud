// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Wordmark } from '@bankstract/ui'
import type { ReactNode } from 'react'

import { DemoClient } from './components/DemoClient'

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline'

// Footer links: a visible resting affordance (underline on hover) plus a branded focus ring.
const navLink = `rounded-sm text-fg-secondary underline-offset-4 hover:text-fg hover:underline ${focusRing}`

const CONTAINER = 'mx-auto w-full max-w-5xl px-6'

// Where to go next. Pastel tiles like the landing; `surface-tint` scopes readable text on each.
const NEXT: readonly { tint: string; label: string; title: string; href: string; reload?: boolean }[] = [
  {
    tint: 'bg-tint-3',
    label: 'for production',
    title: 'Read the API docs',
    href: '/docs',
    reload: true,
  },
  {
    tint: 'bg-tint-1',
    label: "don't trust us?",
    title: 'Self-host the stack',
    href: 'https://github.com/logickoder/bankstract-cloud/blob/main/infra/README.md',
  },
  {
    tint: 'bg-tint-4',
    label: 'mit licensed',
    title: 'Read the engine',
    href: 'https://github.com/logickoder/bankstract',
  },
]

// `header` and `footer` replace the built-in slim chrome. The hosted app passes the marketing site's,
// so /demo matches the rest of the site and keeps Sign in. The self-host bundle passes nothing: it
// has no pricing, privacy or sign-in routes to link to, and this package stays decoupled from
// the marketing one.
export function DemoHome({ header, footer }: { header?: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col">
      {header ?? (
      <header className="border-b border-border">
        <div className={`${CONTAINER} flex h-16 items-center justify-between`}>
          <a
            href="/"
            className={`flex h-11 items-center gap-2 rounded-sm text-fg ${focusRing}`}
            aria-label="bankstract home"
          >
            <Wordmark className="text-2xl" />
          </a>
          <nav aria-label="Main" className="flex items-center">
            <a href="/docs" className={`flex h-11 items-center px-3 text-sm font-medium text-fg-secondary hover:text-fg ${focusRing}`}>
              Docs
            </a>
            <a
              href="https://github.com/logickoder/bankstract-cloud"
              className={`flex h-11 items-center px-3 text-sm font-medium text-fg-secondary hover:text-fg ${focusRing}`}
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>
      )}

      <section className="wash-paper relative">
        <div className={`${CONTAINER} pt-12 pb-16 sm:pt-16 sm:pb-20`}>
          <p className="font-mono text-xs text-fg-tertiary">demo · personal use · no signup</p>
          <h1 className="mt-3 text-5xl leading-[1.04] font-normal tracking-[-0.03em] text-fg sm:text-6xl">
            Drop your bank{' '}
            <em className="font-display font-normal italic tracking-[-0.03em] text-accent-text">
              statement
            </em>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-fg-secondary">
            PDF in, clean transactions out. No storage. Your file is read in memory and dropped when
            the response ends.
          </p>
          <div className="mt-10">
            <DemoClient />
          </div>
        </div>
      </section>

      <section className={`${CONTAINER} py-12 sm:py-16`}>
        <ul className="grid gap-3 sm:grid-cols-3">
          {NEXT.map((item) => (
            <li key={item.title}>
              <a
                href={item.href}
                className={`surface-tint ${item.tint} group flex h-full min-h-36 flex-col justify-between rounded-lg p-6 ${focusRing}`}
              >
                <span className="font-mono text-xs text-fg-tertiary">{item.label}</span>
                <span className="mt-6 font-display text-2xl font-semibold tracking-[-0.02em] group-hover:underline group-hover:underline-offset-4">
                  {item.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-auto">
        {footer ?? (
      <footer className="border-t border-border">
        <div
          className={`${CONTAINER} flex flex-col gap-4 py-8 text-sm text-fg-tertiary sm:flex-row sm:items-center sm:justify-between`}
        >
          <p>
            Built in Lagos. Built by <Anchor href="https://logickoder.dev">Jeffery Orazulike</Anchor>.
          </p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a className={navLink} href="https://github.com/logickoder/bankstract">
              Engine
            </a>
            <a
              className={navLink}
              href="https://github.com/logickoder/bankstract-cloud/blob/main/infra/README.md"
            >
              Self-host
            </a>
            <a
              className={navLink}
              href="https://github.com/logickoder/bankstract-cloud/blob/main/SECURITY.md"
            >
              Security
            </a>
          </nav>
        </div>
      </footer>
        )}
      </div>
    </main>
  )
}
