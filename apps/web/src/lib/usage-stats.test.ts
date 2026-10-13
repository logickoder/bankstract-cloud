// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { summarize } from './usage-stats'

describe('summarize', () => {
  it('totals, finds the busiest day and counts active days', () => {
    const stats = summarize([
      { date: '2026-10-01', count: 0 },
      { date: '2026-10-02', count: 4 },
      { date: '2026-10-03', count: 2 },
    ])
    expect(stats).toEqual({
      total: 6,
      peak: { date: '2026-10-02', count: 4 },
      average: 2,
      activeDays: 2,
    })
  })

  it('has no peak when every day is empty', () => {
    expect(summarize([{ date: '2026-10-01', count: 0 }]).peak).toBeNull()
  })

  it('is all zeros for no days', () => {
    expect(summarize([])).toEqual({ total: 0, peak: null, average: 0, activeDays: 0 })
  })
})
