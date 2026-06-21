// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-tertiary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-glow disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
