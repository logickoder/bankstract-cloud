// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import {
  displayBytes,
  displayDate,
  displayDay,
  displayMoney,
  displayNaira,
  isZeroAmount,
  signedNaira,
} from './index'

describe('isZeroAmount', () => {
  it('is true only for an amount that is exactly zero', () => {
    expect(isZeroAmount('0')).toBe(true)
    expect(isZeroAmount('0.00')).toBe(true)
    expect(isZeroAmount('000.0')).toBe(true)
  })

  it('is false for non-zero, missing and empty values', () => {
    expect(isZeroAmount('0.01')).toBe(false)
    expect(isZeroAmount('10')).toBe(false)
    expect(isZeroAmount('100.00')).toBe(false)
    expect(isZeroAmount(null)).toBe(false)
    expect(isZeroAmount('')).toBe(false)
  })
})

describe('displayMoney', () => {
  it('groups thousands while keeping the fractional part exact', () => {
    expect(displayMoney('250.50')).toBe('250.50')
    expect(displayMoney('0')).toBe('0')
    expect(displayMoney('14000.00')).toBe('14,000.00')
    expect(displayMoney('1000000.99')).toBe('1,000,000.99')
  })

  it('does not lose precision (string grouping, no Number coercion)', () => {
    expect(displayMoney('9007199254740993.01')).toBe('9,007,199,254,740,993.01')
  })

  it('renders null/empty as a dash', () => {
    expect(displayMoney(null)).toBe('-')
    expect(displayMoney('')).toBe('-')
  })
})

describe('displayNaira', () => {
  it('prefixes the sign on grouped values', () => {
    expect(displayNaira('14000.00')).toBe('₦14,000.00')
  })

  it('passes the dash through without a sign', () => {
    expect(displayNaira(null)).toBe('-')
  })
})

describe('displayDay', () => {
  it('drops the year and the zero pad', () => {
    expect(displayDay('2026-10-07')).toBe('Oct 7')
  })

  it('falls back to a dash for null', () => {
    expect(displayDay(null)).toBe('-')
  })
})

describe('signedNaira', () => {
  it('shows credit as a positive signed value', () => {
    expect(signedNaira('0', '4000.00')).toEqual({ text: '+ ₦4,000.00', isCredit: true })
  })

  it('shows debit as a negative signed value', () => {
    expect(signedNaira('500.00', '0')).toEqual({ text: '− ₦500.00', isCredit: false })
  })

  it('treats a 0.00 credit as no credit', () => {
    expect(signedNaira('500.00', '0.00')).toEqual({ text: '− ₦500.00', isCredit: false })
  })
})

describe('displayBytes', () => {
  it('formats sizes', () => {
    expect(displayBytes(500)).toBe('500 B')
    expect(displayBytes(2048)).toBe('2 KB')
    expect(displayBytes(2_516_582)).toBe('2.4 MB')
  })
})

describe('displayDate', () => {
  it('formats an ISO datetime to "DD Mon YYYY"', () => {
    expect(displayDate('2026-01-05T09:30:00')).toBe('05 Jan 2026')
    expect(displayDate('2026-12-31T00:00:00')).toBe('31 Dec 2026')
  })

  it('renders null as a dash', () => {
    expect(displayDate(null)).toBe('-')
  })
})
