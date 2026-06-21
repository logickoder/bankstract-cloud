// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { ALL_BANKS, PLANNED_BANKS, SHIPPED_BANKS } from './banks'
import { CODE_SAMPLES } from './code-samples'
import { ENTERPRISE, FREE_TIERS, PAID_TIERS } from './pricing'

describe('banks', () => {
  it('ships the engine parsers, lowercase', () => {
    expect(SHIPPED_BANKS.length).toBeGreaterThan(0)
    for (const b of SHIPPED_BANKS) {
      expect(b.id).toBe(b.id.toLowerCase())
      expect(b.status).toBe('shipped')
    }
  })

  it('marks planned banks distinctly and merges all', () => {
    for (const b of PLANNED_BANKS) expect(b.status).toBe('planned')
    expect(ALL_BANKS).toHaveLength(SHIPPED_BANKS.length + PLANNED_BANKS.length)
  })
})

describe('pricing', () => {
  it('has three paid tiers with exactly one highlight', () => {
    expect(PAID_TIERS).toHaveLength(3)
    expect(PAID_TIERS.filter((t) => t.highlight)).toHaveLength(1)
  })

  it('quotes NGN amounts', () => {
    for (const t of PAID_TIERS) expect(t.price.startsWith('₦')).toBe(true)
    expect(FREE_TIERS.length).toBe(2)
    expect(ENTERPRISE.band).toContain('₦')
  })
})

describe('code samples', () => {
  it('covers four languages with non-empty code', () => {
    expect(CODE_SAMPLES).toHaveLength(4)
    const langs = new Set(CODE_SAMPLES.map((s) => s.lang))
    expect(langs.size).toBe(4)
    for (const s of CODE_SAMPLES) expect(s.code.length).toBeGreaterThan(0)
  })
})
