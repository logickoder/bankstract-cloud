// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Shown when the dashboard could not reach the API, in place of anything that would read as "you have
// none" (no keys, no plan, zero parses). Voice: what, why, what to do.
export function Unavailable({ what }: { what: string }) {
  return (
    <div role="alert" className="mt-8 rounded-lg border border-border-control bg-bg-secondary p-6">
      <p className="font-display text-lg font-semibold text-fg">{what} unavailable.</p>
      <p className="mt-1 text-sm text-fg-secondary">
        The dashboard could not reach the API, so it cannot say what you have. Nothing was lost.
        Reload in a minute.
      </p>
    </div>
  )
}
