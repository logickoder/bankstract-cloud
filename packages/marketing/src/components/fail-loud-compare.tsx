// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { guessedMismatch } from '../lib/hero-sample'
import { useSample } from '../lib/use-sample'

// The same sample statement, two outcomes. Left: a generic parser that misreads one digit and
// returns the wrong total without a word. Right: the check bankstract runs on every parse. No
// competitor is named, and the figures are the shared synthetic sample.
export function FailLoudCompare() {
  const sample = useSample()
  const { rowsSum, statement, difference } = guessedMismatch(sample)
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="flex min-w-0 flex-col rounded-lg border border-border bg-bg-secondary p-6 sm:p-8">
        <p className="font-mono text-xs text-fg-tertiary">A parser that guesses</p>
        <p className="mt-6 font-mono text-4xl tracking-[-0.04em] whitespace-nowrap text-fg sm:text-5xl">
          <span aria-hidden="true">&#8358;</span>
          {rowsSum}
        </p>
        <p className="mt-3 text-fg-secondary">Reads one digit wrong. Returns a total anyway.</p>
        <p className="mt-auto pt-8 text-sm text-fg-tertiary">No error. No warning. It looks fine.</p>
      </div>

      <div className="flex min-w-0 flex-col rounded-lg bg-tint-3 p-6 text-sheet-ink sm:p-8">
        <p className="font-mono text-xs text-sheet-ink/70">bankstract</p>
        <dl className="mt-6 space-y-2 font-mono text-base sm:text-lg">
          <div className="flex justify-between gap-4">
            <dt className="text-sheet-ink/70">rows add up to</dt>
            <dd>{rowsSum}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sheet-ink/70">statement says</dt>
            <dd>{statement}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-sheet-ink/25 pt-2">
            <dt className="text-sheet-ink/70">difference</dt>
            <dd>{difference}</dd>
          </div>
        </dl>
        <p className="mt-6 font-display text-3xl tracking-[-0.02em] sm:text-4xl">
          Refused, with the reason.
        </p>
        <p className="mt-auto pt-8 font-mono text-xs text-sheet-ink/70">
          HTTP status 422: the statement failed its checks.
        </p>
      </div>
    </div>
  )
}
