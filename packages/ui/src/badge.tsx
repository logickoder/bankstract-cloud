// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { type VariantProps, cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

const badge = cva('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', {
  variants: {
    tone: {
      accent: 'bg-accent-muted text-accent',
      muted: 'bg-bg-tertiary text-fg-secondary border border-border',
      success: 'bg-success/15 text-success',
      warning: 'bg-warning/15 text-warning',
      error: 'bg-error/15 text-error',
    },
  },
  defaultVariants: { tone: 'muted' },
})

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badge>

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />
}
