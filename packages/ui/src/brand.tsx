// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { SVGProps } from 'react'

// The bankstract "extract" mark (bare, no plate): a lifted accent row pulled from a two-row stack.
// The stack rows use currentColor so they follow the surrounding text colour; the lifted row stays
// the brand burnt-orange. Decorative - the adjacent wordmark carries the name. Size it with a height
// class on className (viewBox is 24x12, so a height yields a 2:1 width).
export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="5" y="0" width="14" height="2.5" rx="1.25" fill="var(--color-accent)" />
      <rect x="5" y="5.5" width="10" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="5" y="9.5" width="10" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  )
}
