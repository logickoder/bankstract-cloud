// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { displayDate } from '@bankstract/format'
import { cn } from '@bankstract/ui'

import { useSample } from '../lib/use-sample'

// The sample statement as a tile grid (Capital): tile size follows how much a row matters. The
// last tile is the reconciliation proof, the same arithmetic the worker runs on every parse.
// Text is fixed ink: pastel tiles stay legible on paper and on ink bands alike.
const SPANS = ['col-span-2 sm:row-span-2', 'col-span-1', 'col-span-1'] as const
const TINTS = ['bg-tint-1', 'bg-tint-2', 'bg-tint-3'] as const

export function SampleTiles() {
  const { rows, opening, credits, debits, closing } = useSample()
  return (
    <div role="img" aria-label="Three parsed transactions and the reconciliation totals">
      <div className="grid auto-rows-[minmax(7rem,auto)] grid-cols-2 gap-3 sm:auto-rows-[clamp(5.75rem,11svh,8.5rem)] sm:grid-cols-3">
      {rows.map((row, i) => (
        <div
          key={row.date}
          className={cn(
            'flex min-w-0 flex-col gap-3 overflow-hidden rounded-lg p-4 text-sheet-ink',
            i === 0 ? 'justify-between' : 'justify-end',
            SPANS[i],
            TINTS[i],
          )}
        >
          {i === 0 ? (
            <span className="font-mono text-xs text-sheet-ink/70">{displayDate(row.date)}</span>
          ) : null}
          <div className="min-w-0">
            <p
              className={cn(
                'font-mono tracking-tight',
                i === 0 ? 'text-3xl sm:text-4xl' : 'text-[clamp(0.95rem,1.7vw,1.25rem)] whitespace-nowrap',
              )}
            >
              <span aria-hidden="true">&#8358;</span>
              {row.amount}
            </p>
            <p className="mt-1 truncate text-sm">{row.narration}</p>
            {i === 0 ? (
              <p className="truncate font-mono text-xs text-sheet-ink/70">bal {row.balance}</p>
            ) : null}
          </div>
        </div>
      ))}
      </div>
      <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg bg-tint-4 px-4 py-3 text-sheet-ink">
        <span className="text-sm">Totals match</span>
        <span className="font-mono text-xs sm:text-sm">
          {opening} + {credits} - {debits} = {closing}
        </span>
      </div>
    </div>
  )
}
