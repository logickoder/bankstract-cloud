// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

// `error` wires aria-invalid + the error border so consumers get consistent invalid styling.
export function Input({
  className,
  error = false,
  ...props
}: ComponentProps<'input'> & { error?: boolean }) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(
        'w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-tertiary focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow disabled:opacity-50',
        error && 'border-error focus-visible:border-error focus-visible:ring-error/30',
        className,
      )}
      {...props}
    />
  )
}
