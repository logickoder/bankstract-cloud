// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ComponentProps } from 'react'

import { cn } from './lib/cn'

// Burnt-orange functional link (DESIGN: single accent, links only). Exported as both a
// component and the bare class string, for callers that style a <button> or next/link.
export const linkClass = 'text-accent underline-offset-4 hover:underline'

export function Anchor({ className, ...props }: ComponentProps<'a'>) {
  return <a className={cn(linkClass, className)} {...props} />
}
