// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { computeSampleScoreBreakdown } from './sample-score'
import { generateSampleStatement } from './sample-statement'

describe('computeSampleScoreBreakdown', () => {
  const samples = Array.from({ length: 200 }, () => generateSampleStatement())

  it('total always stays within the 300-850 range', () => {
    for (const sample of samples) {
      const { total } = computeSampleScoreBreakdown(sample)
      expect(total).toBeGreaterThanOrEqual(300)
      expect(total).toBeLessThanOrEqual(850)
      expect(Number.isInteger(total)).toBe(true)
    }
  })

  it('the breakdown shown to the visitor sums to the same total the badge uses', () => {
    for (const sample of samples) {
      const breakdown = computeSampleScoreBreakdown(sample)
      expect(breakdown.base + breakdown.salaryBonus + breakdown.netBonus + breakdown.spendBonus).toBe(
        breakdown.total,
      )
    }
  })
})
