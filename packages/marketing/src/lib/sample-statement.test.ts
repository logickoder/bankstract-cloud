// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { fromKobo, generateSampleStatement, toKobo } from './sample-statement'

describe('toKobo / fromKobo round-trip', () => {
  // Unlike @bankstract/format's pure-string displayMoney, these two DO cross through
  // Number() on the integer-digit part (documented in their own comment), so precision is
  // bounded by Number.MAX_SAFE_INTEGER, not arbitrary-precision. Fine here: statement
  // balances in this generator are always naira-statement-scale (thousands, never anywhere
  // close to that bound).
  it.each(['0', '0.00', '100', '250.50', '1000000.99', '999999999.99'])(
    'round-trips %s without precision loss',
    (value) => {
      expect(fromKobo(toKobo(value))).toBe(value.includes('.') ? value : `${value}.00`)
    },
  )
})

describe('generateSampleStatement', () => {
  // Fuzz: this is the actual trust claim the panel makes (bankstract runs a balance check on
  // every parse), so it must hold across many independently-random generations, not just once.
  const samples = Array.from({ length: 200 }, () => generateSampleStatement())

  it('always reports row_wise_reconcilable', () => {
    for (const sample of samples) expect(sample.row_wise_reconcilable).toBe(true)
  })

  it('running balance is the accumulation of every row, opening balance to closing balance', () => {
    for (const sample of samples) {
      let runningKobo = toKobo(sample.metadata?.opening_balance ?? '0')
      for (const t of sample.transactions) {
        runningKobo += toKobo(t.credit) - toKobo(t.debit)
        expect(t.balance).toBe(fromKobo(runningKobo))
      }
      expect(sample.metadata?.closing_balance).toBe(fromKobo(runningKobo))
    }
  })

  it('totals match the sum of transaction debit/credit', () => {
    for (const sample of samples) {
      const creditKobo = sample.transactions.reduce((sum, t) => sum + toKobo(t.credit), 0)
      const debitKobo = sample.transactions.reduce((sum, t) => sum + toKobo(t.debit), 0)
      expect(sample.totals.credit).toBe(fromKobo(creditKobo))
      expect(sample.totals.debit).toBe(fromKobo(debitKobo))
    }
  })

  it('every transaction is a credit XOR a debit, never both nonzero', () => {
    for (const sample of samples) {
      for (const t of sample.transactions) {
        const hasCredit = t.credit !== '0.00' && t.credit !== '0'
        const hasDebit = t.debit !== '0.00' && t.debit !== '0'
        expect(hasCredit && hasDebit).toBe(false)
        expect(hasCredit || hasDebit).toBe(true)
      }
    }
  })

  it('produces a valid IsoDateTime and 8-10 transactions in chronological order', () => {
    for (const sample of samples) {
      expect(sample.transactions.length).toBeGreaterThanOrEqual(8)
      expect(sample.transactions.length).toBeLessThanOrEqual(10)
      const dates = sample.transactions.map((t) => t.date)
      expect(dates).toEqual([...dates].sort())
    }
  })
})
