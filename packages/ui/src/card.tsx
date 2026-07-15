// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

// `interactive` opts a card into the hover affordance (border + lift). Off by default so a
// plain container card doesn't imply it's clickable.
export function Card({
  className,
  interactive = false,
  ...props
}: ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-bg-secondary p-6',
        interactive &&
          'transition-colors hover:border-fg-tertiary hover:shadow-[var(--shadow-card-hover)]',
        className,
      )}
      {...props}
    />
  )
}
