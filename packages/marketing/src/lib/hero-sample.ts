// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// One synthetic statement (FOO / BAR / ACME, fixture rule) for the hero stat and tile grid.
// Money is integer kobo until display, so the arithmetic is exact and the closing balance is
// always derived: opening + credit - debits. Random values never break the reconciliation claim.
export interface SampleRow {
  date: string
  narration: string
  amount: string
  balance: string
}

export interface SampleParse {
  rows: readonly SampleRow[]
  opening: string
  credits: string
  debits: string
  closing: string
}

interface Figures {
  opening: number
  credit: number
  debitA: number
  debitB: number
  narrations: readonly [string, string, string]
}

const DATES = ['2026-06-01', '2026-06-02', '2026-06-03'] as const

const CREDIT_NARRATIONS = ['Transfer FOO', 'Transfer BAR', 'Salary ACME'] as const
const POS_NARRATIONS = ['POS ACME', 'POS FOO', 'Utility ACME'] as const
const SMALL_NARRATIONS = ['Airtime', 'Data bundle', 'Transfer fee'] as const

// kobo -> "12,345.67"
export function formatKobo(kobo: number): string {
  const naira = Math.trunc(kobo / 100)
  const rest = String(kobo % 100).padStart(2, '0')
  return `${naira.toLocaleString('en-US')}.${rest}`
}

// "12,345.67" -> 1234567
export function parseKobo(display: string): number {
  return Math.round(Number(display.replaceAll(',', '')) * 100)
}

// What a parser that guesses would return for this statement: one misread digit, ₦10 off. The
// rows no longer add up to the statement's own closing balance, which is the check bankstract runs.
export function guessedMismatch(sample: SampleParse): { rowsSum: string; statement: string; difference: string } {
  const offKobo = 1_000
  return {
    rowsSum: formatKobo(parseKobo(sample.closing) + offKobo),
    statement: sample.closing,
    difference: formatKobo(offKobo),
  }
}

function build({ opening, credit, debitA, debitB, narrations }: Figures): SampleParse {
  const afterCredit = opening + credit
  const afterA = afterCredit - debitA
  const closing = afterA - debitB
  const [n1, n2, n3] = narrations
  return {
    rows: [
      { date: DATES[0], narration: n1, amount: `+${formatKobo(credit)}`, balance: formatKobo(afterCredit) },
      { date: DATES[1], narration: n2, amount: `-${formatKobo(debitA)}`, balance: formatKobo(afterA) },
      { date: DATES[2], narration: n3, amount: `-${formatKobo(debitB)}`, balance: formatKobo(closing) },
    ],
    opening: formatKobo(opening),
    credits: formatKobo(credit),
    debits: formatKobo(debitA + debitB),
    closing: formatKobo(closing),
  }
}

// Server render, no-JS, and the first client paint. 1,000.00 + 250.00 - 40.00 - 5.00 = 1,205.00.
export const DEFAULT_SAMPLE: SampleParse = build({
  opening: 100_000,
  credit: 25_000,
  debitA: 4_000,
  debitB: 500,
  narrations: ['Transfer FOO', 'POS ACME', 'Airtime'],
})

// Whole naira amounts in kobo, stepped to 50 kobo so the figures read like real statements.
function between(rng: () => number, minNaira: number, maxNaira: number): number {
  return (minNaira + Math.floor(rng() * (maxNaira - minNaira + 1))) * 100
}

function pick<T>(rng: () => number, pool: readonly T[]): T {
  const item = pool[Math.floor(rng() * pool.length)]
  if (item === undefined) throw new Error('pick() called on an empty pool')
  return item
}

export function generateSample(rng: () => number): SampleParse {
  const opening = between(rng, 80_000, 650_000)
  const credit = between(rng, 40_000, 300_000)
  const debitA = between(rng, 5_000, 60_000)
  const debitB = between(rng, 100, 4_900)
  return build({
    opening,
    credit,
    debitA,
    debitB,
    narrations: [pick(rng, CREDIT_NARRATIONS), pick(rng, POS_NARRATIONS), pick(rng, SMALL_NARRATIONS)],
  })
}
