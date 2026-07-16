// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ComponentProps } from 'react'

import { cn } from './lib/cn'
import { SmartLink } from './smart-link'

// Burnt-orange functional link (DESIGN: single accent, links only). Exported as both a
// component and the bare class string, for callers that style a <button> or next/link.
export const linkClass =
  'text-accent underline-offset-4 hover:underline rounded-sm focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

// SmartLink owns client-nav vs full-load (in-app route -> next/link, external / cross-app -> <a>).
// Pass `reload` to force a full navigation for a relative path that leaves this Next app (/docs).
export function Anchor({ className, ...props }: ComponentProps<'a'> & { reload?: boolean }) {
  return <SmartLink className={cn(linkClass, className)} {...props} />
}
