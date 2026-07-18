// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Anchor, cn } from '@bankstract/ui'

import { PAGE_CONTAINER } from './Section'

// The back-to-home link at the top of a standalone marketing page (pricing, privacy, for-lenders).
// container=false drops the page-width wrapper, for placing the link inside a Section that already
// provides the container (e.g. the for-lenders grain hero).
export function BackToHome({ container = true }: { container?: boolean }) {
  const link = <Anchor href="/">← bankstract</Anchor>
  if (!container) return link
  return <div className={cn(PAGE_CONTAINER, 'pt-8')}>{link}</div>
}
