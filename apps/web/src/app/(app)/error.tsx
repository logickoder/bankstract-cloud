// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Button } from '@bankstract/ui'

// Fallback boundary for the whole (app) group (auth + dashboard) when a route throws with no
// closer error.tsx. Keeps the app from white-screening on an unexpected server error.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="font-display text-2xl font-bold tracking-tight text-fg">Something broke</h2>
      <p className="mx-auto mt-2 max-w-sm text-fg-secondary">
        An unexpected error stopped this page from rendering. Try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
