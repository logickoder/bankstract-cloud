// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Button } from '@bankstract/ui'

// Catches a thrown worker failure from any dashboard page's data fetch. Distinguishes a real
// error from an empty state: the empty states live in the pages; this only shows when a fetch
// actually failed.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="py-16 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight text-fg">
        Couldn&apos;t load your dashboard
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-fg-secondary">
        The service didn&apos;t respond. This is on us, not your data.
      </p>
      <Button className="mt-6" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
