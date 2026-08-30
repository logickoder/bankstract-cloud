// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import type { ParseResponse } from '@bankstract/types'
import { Badge, Input } from '@bankstract/ui'
import { useMemo } from 'react'

import { computeSampleScoreBreakdown, SCORE_MAX, SCORE_MIN } from '../lib/sample-score'

const DEFAULT_THRESHOLD = 650

// Deliberately separate card, dashed border, so it never reads as part of the ParseResponse
// table above it. The caption is not decorative copy: it is what keeps this consistent with
// the page's own trust-block line ("It returns the raw structured data, not a score or a
// verdict. Your credit logic stays yours."). bankstract does not compute this, the visitor's
// own threshold does.
export function SampleScoreCard({
  data,
  threshold,
  onThresholdChange,
}: {
  data: ParseResponse
  threshold: number
  onThresholdChange: (value: number) => void
}) {
  // Threshold-only re-renders (every keystroke in the Input below) shouldn't recompute this;
  // it only depends on data, which is stable between Shuffles.
  const breakdown = useMemo(() => computeSampleScoreBreakdown(data), [data])
  const approved = breakdown.total >= threshold

  return (
    <div className="rounded-lg border border-dashed border-border bg-bg-tertiary p-6">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-fg-tertiary">Sample score</p>
          <p className="font-mono text-2xl font-semibold text-fg">{breakdown.total}</p>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sample-threshold" className="text-xs text-fg-tertiary">
            Your approval threshold
          </label>
          <Input
            id="sample-threshold"
            type="number"
            min={SCORE_MIN}
            max={SCORE_MAX}
            value={threshold}
            onChange={(e) => {
              const next = Number(e.target.value)
              if (!Number.isNaN(next)) onThresholdChange(next)
            }}
            className="w-24 font-mono"
          />
        </div>
        <Badge tone={approved ? 'success' : 'error'} className="ml-auto">
          {approved ? 'Approved' : 'Declined'}
        </Badge>
      </div>
      <p className="mt-4 text-xs text-fg-tertiary">
        Illustrative. Computed by your own underwriting logic on top of the raw data above, not
        by bankstract.
      </p>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-fg-secondary hover:text-fg">
          How this number was calculated
        </summary>
        <ul className="mt-2 flex flex-col gap-1 font-mono text-fg-tertiary">
          <li>base {breakdown.base}</li>
          <li>+ {breakdown.salaryBonus} salary credit detected</li>
          <li>+ {breakdown.netBonus} balance grew over the period</li>
          <li>+ {breakdown.spendBonus} spend stayed low relative to income</li>
          <li className="text-fg-secondary">= {breakdown.total} (one example rule, not a real one)</li>
        </ul>
      </details>
    </div>
  )
}

export { DEFAULT_THRESHOLD }
