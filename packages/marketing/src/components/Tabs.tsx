// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { cn } from '@bankstract/ui'
import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react'


// Server pre-renders each panel (e.g. a highlighted CodeBlock) and hands them in as
// ReactNodes; this client shell only toggles which one shows. Keeps the highlighter
// server-side while the switcher stays interactive. Full WAI-ARIA tab pattern: roving
// tabindex + arrow/Home/End keys, panels wired to their tab via aria-controls/labelledby.
export interface TabItem {
  label: string
  panel: ReactNode
}

export function Tabs({ items }: { items: TabItem[] }) {
  const [active, setActive] = useState(0)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tabId = (i: number) => `${baseId}-tab-${i}`
  const panelId = (i: number) => `${baseId}-panel-${i}`

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = items.length - 1
    let next: number
    switch (e.key) {
      case 'ArrowRight':
        next = active === last ? 0 : active + 1
        break
      case 'ArrowLeft':
        next = active === 0 ? last : active - 1
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        return
    }
    e.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-md bg-bg-tertiary p-1"
        role="tablist"
        onKeyDown={onKeyDown}
      >
        {items.map((item, i) => (
          <button
            key={item.label}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={tabId(i)}
            aria-selected={i === active}
            aria-controls={panelId(i)}
            tabIndex={i === active ? 0 : -1}
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
      {items.map((item, i) => (
        <div
          key={item.label}
          role="tabpanel"
          id={panelId(i)}
          aria-labelledby={tabId(i)}
          hidden={i !== active}
        >
          {item.panel}
        </div>
      ))}
    </div>
  )
}
