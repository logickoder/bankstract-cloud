// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { cn } from '@bankstract/ui'
import { type ReactNode, useState } from 'react'


// Server pre-renders each panel (e.g. a highlighted CodeBlock) and hands them in as
// ReactNodes; this client shell only toggles which one shows. Keeps the highlighter
// server-side while the switcher stays interactive.
export interface TabItem {
  label: string
  panel: ReactNode
}

export function Tabs({ items }: { items: TabItem[] }) {
  const [active, setActive] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <div
        className="inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-md bg-bg-tertiary p-1"
        role="tablist"
      >
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              'shrink-0 rounded-sm px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
              i === active ? 'bg-bg-secondary text-fg' : 'text-fg-secondary hover:text-fg',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items[active]?.panel}
    </div>
  )
}
