// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'

import { links } from '../lib/links'

import { PAGE_CONTAINER } from './Section'

interface FooterCol {
  title: string
  items: { label: string; href: string }[]
}

const COLS: readonly FooterCol[] = [
  {
    title: 'Product',
    items: [
      { label: 'Demo', href: links.demo },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Self-host', href: links.selfHost },
    ],
  },
  {
    title: 'Docs',
    items: [
      { label: 'Quickstart', href: links.docs },
      { label: 'API reference', href: links.docs },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Engine', href: links.engine },
      { label: 'Cloud', href: links.cloud },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Security', href: links.security },
      { label: 'License (AGPL-3.0)', href: links.cloud },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className={cn(PAGE_CONTAINER, 'grid gap-8 py-12 sm:grid-cols-4')}>
        {COLS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-medium text-fg">{col.title}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {col.items.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-fg-secondary hover:text-fg"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={cn(PAGE_CONTAINER, 'pb-10 text-xs text-fg-tertiary')}>
        <p>Open source statement parsing API for Nigerian banks.</p>
        <p className="mt-1">Built in Lagos. Built by logickoder.</p>
      </div>
    </footer>
  )
}
