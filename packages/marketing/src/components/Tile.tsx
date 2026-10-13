// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'
import type { ReactNode } from 'react'

type Tint = 'green' | 'yellow' | 'peach' | 'lilac' | 'plain' | 'ink'

// The page tile: rounded, generous padding. Pastel tints scope their own text tokens
// (`.surface-tint`), so children use the normal fg tokens. `ink` is code only (DESIGN surfaces).
const TINT: Record<Tint, string> = {
  green: 'surface-tint bg-tint-1',
  yellow: 'surface-tint bg-tint-2',
  peach: 'surface-tint bg-tint-3',
  lilac: 'surface-tint bg-tint-4',
  plain: 'border border-border bg-bg',
  ink: 'surface-ink',
}

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
    <div className={cn('flex min-w-0 flex-col rounded-lg p-6 sm:p-8', TINT[tint], className)}>
      {children}
    </div>
  )
}
