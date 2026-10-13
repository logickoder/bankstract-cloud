// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import type { ParseResponse } from '@bankstract/types'
import { Input } from '@bankstract/ui'
import { useMemo } from 'react'

import { computeSampleScoreBreakdown, SCORE_MAX, SCORE_MIN } from '../lib/sample-score'

const DEFAULT_THRESHOLD = 650

// Deliberately a separate lilac tile, so it never reads as part of the ParseResponse table beside it. The caption is not decorative copy: it is what keeps this consistent with
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
    <div className="surface-tint grid gap-6 rounded-lg bg-tint-4 p-6 sm:p-8 lg:grid-cols-[auto_auto_1fr] lg:items-center lg:gap-12">
      <div className="flex items-end gap-4">
        <div>
          <p className="font-mono text-xs text-fg-tertiary">sample score</p>
          <p className="mt-2 font-mono text-6xl leading-none tracking-[-0.04em] text-fg">
            {breakdown.total}
          </p>
        </div>
        <span className="mb-1 rounded-full bg-fg px-3 py-1 font-mono text-xs text-bg">
          {approved ? 'approved' : 'declined'}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="sample-threshold" className="text-sm text-fg-secondary">
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
          className="h-11 w-28 bg-bg font-mono"
        />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-secondary">
          Illustrative. Computed by your own underwriting logic on top of the raw data, not by
          bankstract.
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer py-3 text-fg hover:underline">
            How this number was calculated
          </summary>
          <ul className="mt-2 flex flex-col gap-1 font-mono text-xs text-fg-secondary">
            <li>base {breakdown.base}</li>
            <li>+ {breakdown.salaryBonus} salary credit detected</li>
            <li>+ {breakdown.netBonus} balance grew over the period</li>
            <li>+ {breakdown.spendBonus} spend stayed low relative to income</li>
            <li className="text-fg">= {breakdown.total} (one example rule, not a real one)</li>
          </ul>
        </details>
      </div>
    </div>
  )
}

export { DEFAULT_THRESHOLD }
