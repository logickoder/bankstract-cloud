// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-bg border-accent hover:bg-accent-hover hover:border-accent-hover',
  secondary: 'bg-transparent text-fg border-border hover:bg-bg-secondary hover:border-fg-secondary',
  ghost: 'bg-transparent text-fg-secondary border-transparent hover:bg-bg-secondary hover:text-fg',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`rounded-md border px-5 py-3 text-sm font-medium transition-colors duration-150 disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
