// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { type VariantProps, cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

const button = cva(
  // static-with-hover (DESIGN motion): colour transition only (no scale/glow), a subtle
  // press, and an accent focus ring for keyboard users.
  'inline-flex items-center justify-center rounded-md border font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-bg border-accent hover:bg-accent-hover hover:border-accent-hover',
        secondary:
          'bg-transparent text-fg border-border hover:bg-bg-secondary hover:border-fg-secondary',
        ghost: 'bg-transparent text-fg-secondary border-transparent hover:bg-bg-secondary hover:text-fg',
      },
      size: {
        default: 'px-5 py-3 text-sm',
        sm: 'px-3 py-2 text-xs',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof button>

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />
}
