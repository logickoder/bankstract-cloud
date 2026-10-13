// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, Wordmark, cn, SmartLink } from '@bankstract/ui'

import { links } from '../lib/links'

import { PAGE_CONTAINER } from './Section'
import { GithubIcon, LinkedinIcon, XIcon } from './social-icons'

interface FooterCol {
  title: string
  // reload: /docs is a relative path in prod but a separate app (Cloudflare Pages), so it must
  // full-load rather than client-route.
  items: { label: string; href: string; reload?: boolean }[]
}

const COLS: readonly FooterCol[] = [
  {
    title: 'Product',
    items: [
      { label: 'Demo', href: links.demo },
      { label: 'For lenders', href: '/for-lenders' },
      { label: 'Pricing', href: links.pricing },
      { label: 'Self-host', href: links.selfHost },
    ],
  },
  {
    title: 'Developers',
    items: [
      { label: 'Docs', href: links.docs, reload: true },
      { label: 'Engine', href: links.engine },
      { label: 'Source', href: links.cloud },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy', href: links.privacy },
      { label: 'Security', href: links.security },
      { label: 'AGPL-3.0', href: links.license },
    ],
  },
]

const SOCIALS = [
  { label: 'logickoder on GitHub', href: links.ownerGithub, Icon: GithubIcon },
  { label: 'logickoder on X', href: links.ownerX, Icon: XIcon },
  { label: 'logickoder on LinkedIn', href: links.ownerLinkedin, Icon: LinkedinIcon },
] as const

const itemClass =
  'inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-fg-secondary hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline'

export function Footer() {
  return (
    <footer className="overflow-hidden border-t border-border">
      <div className={cn(PAGE_CONTAINER, 'grid gap-10 pt-12 pb-10 sm:grid-cols-[1fr_auto]')}>
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <Wordmark className="text-xl text-fg" />
          </div>
          <p className="mt-4 text-sm text-fg-secondary">
            Open source statement parsing API for Nigerian banks.
          </p>
          <p className="mt-4 text-sm">
            <Anchor href={links.cloud}>Star on GitHub</Anchor>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3">
          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-mono text-xs font-semibold tracking-wider text-fg uppercase">
                {col.title}
              </h3>
              <ul className="mt-2 flex flex-col">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <SmartLink href={item.href} reload={item.reload} className={itemClass}>
                      {item.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className={PAGE_CONTAINER}>
        <div className="flex flex-col gap-2 border-t border-border py-6 text-xs text-fg-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>
            Built in Lagos. Built by <Anchor href={links.owner}>Jeffery Orazulike</Anchor>.
          </p>
          <ul className="-mr-3 flex items-center">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-label={label}
                  className="flex size-11 items-center justify-center rounded-md text-fg-secondary hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none mx-auto h-[0.6em] w-full max-w-5xl overflow-hidden px-6 text-[clamp(3rem,17vw,11.85rem)] select-none"
      >
        <Wordmark className="flex text-sheet-ink opacity-[0.07]" />
      </div>
    </footer>
  )
}
