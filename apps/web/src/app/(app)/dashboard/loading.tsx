// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Streamed while an async dashboard page resolves its worker data. Mirrors the Overview
// shape (heading + stat row + chart) so the layout doesn't jump when content arrives.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-8 w-40 rounded bg-bg-secondary" />
      <div className="mt-2 h-4 w-56 rounded bg-bg-secondary" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-lg border border-border bg-bg-secondary" />
        ))}
      </div>
      <div className="mt-4 h-48 rounded-lg border border-border bg-bg-secondary" />
    </div>
  )
}
