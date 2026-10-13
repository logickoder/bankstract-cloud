// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { EVENT } from '@/lib/event'

// A thin line above the header, for reviewers who land here from a deck. Not floating, so it never
// covers content, and one line so it fits a phone (a QR scan lands on a phone). Always in the markup
// and hidden by CSS unless <html data-event> is set (see lib/event.ts and globals.css). Marketing
// pages and the demo only: it is not in the dashboard or sign-in.
export function EventStrip() {
  return (
    <p className="event-strip items-center justify-center bg-accent px-6 py-1.5 text-center font-mono text-xs font-medium text-accent-fg print:hidden">
      {EVENT.banner}
    </p>
  )
}
