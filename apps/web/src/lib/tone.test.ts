// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { keysTone, overageTone, SUCCESS_FLOOR, successTone, usageTone, WARN_AT } from './tone'

describe('usageTone', () => {
  it('is neutral with no plan (no cap to approach)', () => {
    expect(usageTone({ parses: 5_000, cap: null, overage: 0 })).toBe('neutral')
  })

  it('is neutral well under the cap', () => {
    expect(usageTone({ parses: 3_412, cap: 10_000, overage: 0 })).toBe('neutral')
  })

  it('warns from the warn line up to the cap', () => {
    expect(usageTone({ parses: 10_000 * WARN_AT, cap: 10_000, overage: 0 })).toBe('warn')
    expect(usageTone({ parses: 10_000, cap: 10_000, overage: 0 })).toBe('warn')
  })

  it('alerts once any parse is over the cap', () => {
    expect(usageTone({ parses: 10_001, cap: 10_000, overage: 1 })).toBe('alert')
  })
})

describe('successTone', () => {
  it('is neutral when nothing has been attempted (a 0% rate there means no data)', () => {
    expect(successTone({ rate: 0, attempts: 0 })).toBe('neutral')
  })

  it('is neutral at or above the floor', () => {
    expect(successTone({ rate: SUCCESS_FLOOR, attempts: 100 })).toBe('neutral')
    expect(successTone({ rate: 0.99, attempts: 100 })).toBe('neutral')
  })

  it('alerts below the floor', () => {
    expect(successTone({ rate: SUCCESS_FLOOR - 0.01, attempts: 100 })).toBe('alert')
  })
})

describe('keysTone / overageTone', () => {
  it('warns when no key can parse, and is neutral otherwise', () => {
    expect(keysTone(0)).toBe('warn')
    expect(keysTone(2)).toBe('neutral')
  })

  it('alerts on any overage, neutral on none', () => {
    expect(overageTone(0)).toBe('neutral')
    expect(overageTone(12)).toBe('alert')
  })
})
