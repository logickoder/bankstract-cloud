// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'
import type { ReactNode } from 'react'


// The page content column: centered, capped width, gutter. One source so every section, the hero,
// and the footer share the same horizontal frame.
export const PAGE_CONTAINER = 'mx-auto w-full max-w-5xl px-6'

type Surface = 'base' | 'raised' | 'inverted'

// Section gap is 128px (DESIGN spacing-32): py-16 per side between adjacent sections.
// `raised` is a full-bleed bg-secondary band with hairline borders so the eye reads
// rhythm without leaving the 90%-primary surface. `inverted` is the single warm-white
// band (DESIGN single_section). Grain texture rides hero + feature sections only.
const SURFACE: Record<Surface, string> = {
  base: '',
  raised: 'border-y border-border bg-bg-secondary',
  inverted: 'bg-bg-inverse text-fg-inverse',
}

export function Section({
  children,
  className,
  id,
  surface = 'base',
  grain = false,
}: {
  children: ReactNode
  className?: string
  id?: string
  surface?: Surface
  grain?: boolean
}) {
  return (
    <section id={id} className={cn('relative', SURFACE[surface])}>
      {grain ? <div className="grain-section" aria-hidden="true" /> : null}
      <div className={cn('relative', PAGE_CONTAINER, 'py-12 sm:py-16', className)}>{children}</div>
    </section>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  // DESIGN h2: 48px, weight 700, tracking -0.03em (steps down on small screens). Color is
  // inherited so it reads correctly on dark sections and the inverted warm-white band.
  return (
    <h2 className="font-display text-4xl leading-[1.1] font-bold tracking-[-0.03em] sm:text-[48px]">
      {children}
    </h2>
  )
}
