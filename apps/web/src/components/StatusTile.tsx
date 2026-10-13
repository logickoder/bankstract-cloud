// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'
import type { ReactNode } from 'react'

import type { Tone } from '@/lib/tone'

// Grey unless the number needs attention (see lib/tone.ts). `.surface-tint` remaps the text tokens,
// so children use the same classes in every tone. Colour never carries the state alone: callers
// print the reason as text.
const TONE: Record<Tone, string> = {
  neutral: 'border border-border bg-bg-secondary',
  warn: 'surface-tint bg-tint-2',
  alert: 'surface-tint bg-tint-3',
}

export function StatusTile({
  tone,
  className,
  children,
}: {
  tone: Tone
  className?: string
  children: ReactNode
}) {
  return <section className={cn('rounded-lg p-6', TONE[tone], className)}>{children}</section>
}
