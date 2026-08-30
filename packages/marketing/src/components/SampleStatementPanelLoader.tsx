// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import dynamic from 'next/dynamic'

// next/dynamic's ssr:false is only allowed inside a Client Component, not the Server
// Component (for-lenders.tsx) that renders this. This one-file boundary is the mechanism:
// SampleStatementPanel never runs server-side at all, so it can call generateSampleStatement()
// (which uses Math.random()) directly in its useState initializer with no server/client
// mismatch possible, no null-state, no useEffect, no loading-guarded Shuffle button.
export const SampleStatementPanel = dynamic(
  () => import('./SampleStatementPanel').then((m) => m.SampleStatementPanel),
  { ssr: false, loading: () => <div className="h-64 rounded-lg border border-border bg-bg-secondary" /> },
)
