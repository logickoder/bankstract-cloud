// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'

import { toKobo } from './sample-statement'

// Separate module from sample-statement.ts on purpose: statement generation and this
// illustrative scoring heuristic are two independent concerns with different reasons to
// change (a new narration category shouldn't require touching the scoring formula, and vice
// versa). @bankstract/statement-table's TransactionTable only needs the former;
// SampleScoreCard only needs this.

// Exported: SampleScoreCard's threshold input clamps to this same range, so it can't drift
// out of sync with the range computeSampleScoreBreakdown actually produces.
export const SCORE_MIN = 300
export const SCORE_MAX = 850
const SCORE_BASE = 500

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export interface SampleScoreBreakdown {
  base: number
  salaryBonus: number
  netBonus: number
  spendBonus: number
  total: number
}

// Illustrative only. Bankstract returns raw transactions, not a score, that is the actual
// pitch on /for-lenders, so this is a deliberately simple, deterministic stand-in for "what a
// lender's own underwriting logic might compute on top of the data above," rendered by
// SampleScoreCard with an explicit caption saying exactly that, plus a visible breakdown so
// it reads as one example rule, not a hidden proprietary model. Familiar 300-850 range (same
// shape as a credit-bureau score) so the number reads as recognizable, not arbitrary.
export function computeSampleScoreBreakdown(data: ParseResponse): SampleScoreBreakdown {
  const hasSalary = data.transactions.some((t) => t.narration.startsWith('Salary'))
  const openingKobo = toKobo(data.metadata?.opening_balance ?? '0')
  const closingKobo = toKobo(data.metadata?.closing_balance ?? '0')
  const creditKobo = toKobo(data.totals.credit ?? '0')
  const debitKobo = toKobo(data.totals.debit ?? '0')

  const salaryBonus = hasSalary ? 100 : 0

  const netRatio = (closingKobo - openingKobo) / Math.max(openingKobo, 1)
  const netBonus = Math.round(clamp(netRatio * 100, 0, 150))

  const debitToCreditRatio = debitKobo / Math.max(creditKobo, 1)
  const spendBonus = Math.round(clamp((1 - debitToCreditRatio) * 100, 0, 100))

  const total = Math.round(clamp(SCORE_BASE + salaryBonus + netBonus + spendBonus, SCORE_MIN, SCORE_MAX))

  return { base: SCORE_BASE, salaryBonus, netBonus, spendBonus, total }
}
