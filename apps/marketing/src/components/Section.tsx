// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'
import type { ReactNode } from 'react'


// Shared vertical rhythm + max width for content sections (DESIGN section gap).
export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-5xl px-6 py-20', className)}>
      {children}
    </section>
  )
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">
      {children}
    </h2>
  )
}
