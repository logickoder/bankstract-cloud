// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { DEFAULT_SAMPLE, formatKobo, generateSample, guessedMismatch, parseKobo } from './hero-sample'

const toKobo = (display: string) => Math.round(Number(display.replaceAll(',', '')) * 100)

describe('hero sample', () => {
  it('formats kobo with grouping and two decimals', () => {
    expect(formatKobo(120_500)).toBe('1,205.00')
    expect(formatKobo(5)).toBe('0.05')
    expect(formatKobo(98_765_432)).toBe('987,654.32')
  })

  it('default sample reconciles to the documented figures', () => {
    expect(DEFAULT_SAMPLE.closing).toBe('1,205.00')
    expect(DEFAULT_SAMPLE.rows.at(-1)?.balance).toBe('1,205.00')
  })

  it('every random sample reconciles and stays inside the layout bounds', () => {
    const bounds = { minKobo: 1, maxKobo: 95_000_000, maxStat: '₦950,000.00'.length }
    for (let i = 0; i < 2000; i++) {
      const s = generateSample(Math.random)
      const closing = toKobo(s.opening) + toKobo(s.credits) - toKobo(s.debits)
      expect(formatKobo(closing)).toBe(s.closing)
      expect(s.rows.at(-1)?.balance).toBe(s.closing)
      expect(closing).toBeGreaterThanOrEqual(bounds.minKobo)
      expect(closing).toBeLessThanOrEqual(bounds.maxKobo)
      expect(`₦${s.closing}`.length).toBeLessThanOrEqual(bounds.maxStat)
      for (const row of s.rows) {
        expect(row.narration.length).toBeLessThanOrEqual(14)
        expect(row.amount.length).toBeLessThanOrEqual(12)
      }
    }
  })

  it('holds the bounds at the extremes of the rng', () => {
    const lowest = generateSample(() => 0)
    const highest = generateSample(() => 0.999999)
    expect(toKobo(lowest.closing)).toBeGreaterThan(0)
    expect(toKobo(highest.closing)).toBeLessThanOrEqual(95_000_000)
  })

  it('parses what it formats', () => {
    for (const kobo of [5, 100, 120_500, 98_765_432]) expect(parseKobo(formatKobo(kobo))).toBe(kobo)
  })

  it('the guessed mismatch is exactly 10.00 off and still bounded', () => {
    for (let i = 0; i < 500; i++) {
      const s = generateSample(Math.random)
      const m = guessedMismatch(s)
      expect(parseKobo(m.rowsSum) - parseKobo(m.statement)).toBe(1_000)
      expect(m.difference).toBe('10.00')
      expect(`₦${m.rowsSum}`.length).toBeLessThanOrEqual('₦950,000.00'.length)
    }
  })
})
