// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Badge } from '@bankstract/ui'
import { useState } from 'react'

import { useSample } from '../lib/use-sample'

// Interactive tiles for the bento. Fixture rule: FOO / ACME / 1111 2222 only, never real data.

const FIELDS: readonly { label: string; value: string }[] = [
  { label: 'Holder', value: 'FOO ACME LTD' },
  { label: 'Account', value: '1111 2222 33' },
  { label: 'BVN', value: '1111 2222 333' },
]

export function RedactTile() {
  const [redacted, setRedacted] = useState(true)
  return (
    <div className="flex h-full flex-col">
      <dl className="space-y-2 font-mono text-sm">
        {FIELDS.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3">
            <dt className="text-sheet-ink/70">{f.label}</dt>
            <dd>
              {redacted ? (
                <span className="rounded-sm bg-sheet-ink px-1 text-transparent select-none">
                  {/* The original is not in the DOM while redacted: same-width filler for the bar,
                      and a screen-reader label in its place. */}
                  <span aria-hidden="true">{f.value.replace(/\S/g, '0')}</span>
                  <span className="sr-only">Redacted</span>
                </span>
              ) : (
                <span className="rounded-sm bg-transparent px-1">{f.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => setRedacted((v) => !v)}
        aria-pressed={redacted}
        className="mt-auto min-h-11 self-start rounded-md border border-sheet-ink/60 px-4 text-xs font-medium text-sheet-ink transition-colors hover:bg-sheet-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sheet-ink"
      >
        {redacted ? 'Show original' : 'Redact'}
      </button>
    </div>
  )
}

export function ReconcileTile() {
  const { opening, credits, debits, closing } = useSample()
  const lines: readonly [string, string][] = [
    ['opening', opening],
    ['+ credits', credits],
    ['- debits', debits],
  ]
  return (
    <div className="flex h-full flex-col justify-between">
      <dl className="space-y-1 font-mono text-sm">
        {lines.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-sheet-ink/70">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-sheet-ink/25 pt-3 font-mono text-sm">
        <span>= closing</span>
        <span className="font-medium">{closing}</span>
      </div>
      <Badge tone="muted" className="mt-4 self-start bg-sheet-ink text-sheet border-sheet-ink">
        Totals match
      </Badge>
    </div>
  )
}
