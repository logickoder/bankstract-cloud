// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ReactNode } from 'react'

import { cn } from './lib/cn'

export type Tint = 'green' | 'yellow' | 'peach' | 'lilac' | 'plain' | 'quiet' | 'ink'

// Pastel tints scope their own text tokens (`.surface-tint`), so children use the normal fg tokens
// and the pair can never be split. `quiet` is the grey card, `ink` is code only (DESIGN surfaces).
export const tintClass: Record<Tint, string> = {
  green: 'surface-tint bg-tint-1',
  yellow: 'surface-tint bg-tint-2',
  peach: 'surface-tint bg-tint-3',
  lilac: 'surface-tint bg-tint-4',
  plain: 'border border-border bg-bg',
  quiet: 'border border-border bg-bg-secondary',
  ink: 'surface-ink',
}

// The page tile: rounded, generous padding.
export function Tile({
  tint = 'plain',
  className,
  children,
}: {
  tint?: Tint
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-lg p-6 sm:p-8', tintClass[tint], className)}>
      {children}
    </div>
  )
}
