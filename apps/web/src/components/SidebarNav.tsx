// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { cn } from '@bankstract/ui'
import { ChartColumn, CreditCard, KeyRound, LayoutGrid, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Icons show in the desktop sidebar only. The phone tab row has no room for them, and the labels
// carry the meaning there.
const ITEMS = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutGrid },
  { href: '/dashboard/keys', label: 'Keys', Icon: KeyRound },
  { href: '/dashboard/usage', label: 'Usage', Icon: ChartColumn },
  { href: '/dashboard/billing', label: 'Billing', Icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
] as const

export function SidebarNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Dashboard" className="flex gap-0.5 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-md px-1.5 text-sm whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none sm:px-2 lg:px-3',
              active
                ? 'bg-bg-tertiary font-medium text-fg'
                : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg',
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn('hidden size-4 shrink-0 lg:block', active ? 'text-fg' : 'text-fg-tertiary')}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
