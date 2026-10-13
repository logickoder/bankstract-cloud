// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { SmartLink } from '@bankstract/ui'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

export interface MenuLink {
  label: string
  href: string
  reload?: boolean
}

// The header's links below the sm breakpoint, where they no longer fit in the bar. A disclosure,
// not a modal: the page behind stays readable. It closes on route change (the header persists across
// client navigation), on Escape, and after a link is chosen.
export function MobileMenu({ links }: { links: readonly MenuLink[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const panelId = useId()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-md text-fg hover:bg-bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>
      {open ? (
        <nav
          id={panelId}
          aria-label="Menu"
          className="absolute inset-x-0 top-full border-b border-border bg-bg px-6 py-2 shadow-sm"
        >
          <ul>
            {links.map((link) => (
              <li key={link.label}>
                <SmartLink
                  href={link.href}
                  reload={link.reload}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-base font-medium text-fg"
                >
                  {link.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}
