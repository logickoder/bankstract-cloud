// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { BankEntry } from '../lib/banks'

// DESIGN bank-coverage-cell: the one sanctioned emoji component (coverage legibility over
// brand-purity). live ✅ / next 🚧 / planned 📭. Bank id lowercase + mono (voice rule).
// Status reads from engine-truth data, not the component (Directive 6). No engine semver.
const STATUS: Record<BankEntry['status'], { glyph: string; label: string; tone: string }> = {
  shipped: { glyph: '✅', label: 'live', tone: 'text-fg' },
  next: { glyph: '🚧', label: 'next', tone: 'text-fg-secondary' },
  planned: { glyph: '📭', label: 'planned', tone: 'text-fg-tertiary' },
}

export function BankCoverageCell({ entry }: { entry: BankEntry }) {
  const { glyph, label, tone } = STATUS[entry.status]
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-bg-secondary px-3 py-3 sm:px-4">
      <span aria-hidden="true">{glyph}</span>
      <span className={`truncate font-mono text-sm ${tone}`}>{entry.id}</span>
      <span className="ml-auto shrink-0 text-xs text-fg-tertiary">{label}</span>
    </div>
  )
}
