// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { ALL_BANKS, ROADMAP_BANKS, SHIPPED_BANKS } from './banks'
import { CODE_SAMPLES } from './code-samples'
import { ANNUAL_NOTE, ENTERPRISE, FREE_TIERS, naira, PAID_TIERS } from './pricing'

describe('banks', () => {
  it('ships the engine parsers, lowercase', () => {
    expect(SHIPPED_BANKS.length).toBeGreaterThan(0)
    for (const b of SHIPPED_BANKS) {
      expect(b.id).toBe(b.id.toLowerCase())
      expect(b.status).toBe('shipped')
    }
  })

  it('roadmap banks are next or planned, and only Nigerian banks ship', () => {
    for (const b of ROADMAP_BANKS) expect(['next', 'planned']).toContain(b.status)
    expect(ALL_BANKS).toHaveLength(SHIPPED_BANKS.length + ROADMAP_BANKS.length)
    // wise is a UK fintech, never a Nigerian bank in this grid.
    expect(ALL_BANKS.map((b) => b.id)).not.toContain('wise')
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

  it('derives every display string from the numbers', () => {
    for (const t of PAID_TIERS) {
      expect(t.price).toBe(`₦${naira(t.monthly)}`)
      expect(t.cap).toBe(`${naira(t.includedParses)} parses/mo`)
      expect(t.overage).toBe(`₦${t.overageNaira}/parse`)
    }
  })

  it('prices annual prepay at 15% off twelve months, in whole naira', () => {
    expect(ANNUAL_NOTE).toContain('15%')
    expect(PAID_TIERS.map((t) => t.annual)).toEqual([96_900, 357_000, 1_530_000])
    for (const t of PAID_TIERS) expect(Number.isInteger(t.annual)).toBe(true)
  })

  // The worker bills from tiers.py; the site and dashboard quote this module. If the two diverge a
  // customer is quoted one cap and billed another, so a mismatch fails CI instead.
  it('matches the worker billing tiers (caps and overage)', () => {
    const path = fileURLToPath(
      new URL('../../../../apps/worker/src/bankstract_cloud/tiers.py', import.meta.url),
    )
    const source = readFileSync(path, 'utf8')
    const worker = [
      ...source.matchAll(/"(\w+)": Tier\(name="\w+", monthly_cap=([\d_]+), overage_kobo=([\d_]+)\)/g),
    ].map(([, id, cap, kobo]) => ({
      id,
      includedParses: Number(cap!.replaceAll('_', '')),
      overageNaira: Number(kobo!.replaceAll('_', '')) / 100,
    }))
    expect(worker).toHaveLength(3)
    expect(
      PAID_TIERS.map((t) => ({
        id: t.id,
        includedParses: t.includedParses,
        overageNaira: t.overageNaira,
      })),
    ).toEqual(worker)
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
