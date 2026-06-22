// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-bg-secondary p-6 transition-colors hover:border-fg-tertiary hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.6)]',
        className,
      )}
      {...props}
    />
  )
}
