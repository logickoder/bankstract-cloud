// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { cn } from '@bankstract/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/keys', label: 'API keys' },
  { href: '/dashboard/usage', label: 'Usage' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
] as const

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
      {ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
              active ? 'bg-bg-secondary text-fg' : 'text-fg-secondary hover:text-fg',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
