// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { useSample } from '../lib/use-sample'

// The same sample statement as the hero, as a compact list of white chips (they sit on a pastel
// tile). Shares the hero's sample, so a reroll updates both.
export function SampleRows() {
  const { rows } = useSample()
  return (
    <ul className="min-w-0 flex-1 space-y-2">
      {rows.map((row) => (
        <li
          key={row.date}
          className="flex items-baseline justify-between gap-3 rounded-md bg-sheet/80 px-3 py-2 text-sheet-ink"
        >
          <span className="line-clamp-2 text-sm break-words">{row.narration}</span>
          <span className="shrink-0 font-mono text-sm">{row.amount}</span>
        </li>
      ))}
    </ul>
  )
}
