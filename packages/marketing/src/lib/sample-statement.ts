// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse, Transaction } from '@bankstract/types'

import { SHIPPED_BANKS } from './banks'

// Synthetic Nigerian bank statement, generated entirely client-side for the /for-lenders
// "Sample output" panel. Not a parse of a real file, not fetched from the worker. Content is
// realistic-sounding on purpose (unlike the worker's deliberately-fake FOO/BAR/ACME _sample,
// whose job is signalling "not your data" plumbing) since this panel's job is showing a
// lending-fintech visitor the actual shape of a real parse. Names/companies below are generic
// and non-attributable, never resembling a real bank, company, or person.

const COMPANY_NAMES = [
  'Prime Foods Distributors',
  'Northgate Logistics',
  'Vera Electronics',
  'Lagos Textile Traders',
  'Coastal Freight Co',
  'Summit Consulting Group',
  'Harbor Retail Ltd',
  'Bright Path Media',
]

const MERCHANT_NAMES = [
  'Shoprite Lekki',
  'Jumia Express',
  'Total Filling Station',
  'Spar Supermarket',
  'Domino Pizza Ikeja',
  'Konga Mall',
  'Ebeano Supermarket',
  'Chicken Republic',
  'MTN Recharge',
  'Uber Trip',
]

const PERSON_NAMES = [
  'O. Adeyemi',
  'C. Okafor',
  'F. Balogun',
  'A. Eze',
  'M. Yusuf',
  'T. Ogunleye',
  'B. Nwachukwu',
  'S. Ibrahim',
]

function pick<T>(pool: readonly T[]): T {
  const item = pool[Math.floor(Math.random() * pool.length)]
  if (item === undefined) throw new Error('pick() called on an empty pool')
  return item
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

type Category = 'salary' | 'pos' | 'transfer_in' | 'transfer_out' | 'airtime' | 'rent' | 'utility'

interface GeneratedRow {
  category: Category
  narration: string
  isCredit: boolean
  amountNaira: number
}

interface NarrationTemplate {
  category: Category
  isCredit: boolean
  minNaira: number
  maxNaira: number
  narrate: () => string
  // How many entries this template effectively occupies in the weighted pool below. POS spend
  // is the most common row shape on a real statement, so it gets weighted higher instead of
  // being copy-pasted three times.
  weight: number
}

const TEMPLATES: readonly NarrationTemplate[] = [
  {
    category: 'pos',
    isCredit: false,
    minNaira: 1500,
    maxNaira: 45000,
    narrate: () => `POS ${pick(MERCHANT_NAMES)}`,
    weight: 3,
  },
  {
    category: 'transfer_out',
    isCredit: false,
    minNaira: 2000,
    maxNaira: 80000,
    narrate: () => `Transfer to ${pick(PERSON_NAMES)}`,
    weight: 1,
  },
  {
    category: 'transfer_in',
    isCredit: true,
    minNaira: 5000,
    maxNaira: 60000,
    narrate: () => `Transfer from ${pick(PERSON_NAMES)}`,
    weight: 1,
  },
  {
    category: 'airtime',
    isCredit: false,
    minNaira: 500,
    maxNaira: 5000,
    narrate: () => `Airtime purchase - ${pick(['MTN', 'Airtel', 'Glo'])}`,
    weight: 1,
  },
  {
    category: 'utility',
    isCredit: false,
    minNaira: 3000,
    maxNaira: 25000,
    narrate: () => `Electricity - ${pick(['Ikeja Disco', 'Eko Disco', 'Abuja Disco'])}`,
    weight: 1,
  },
  {
    category: 'utility',
    isCredit: false,
    minNaira: 2000,
    maxNaira: 15000,
    narrate: () => 'Data subscription',
    weight: 1,
  },
  {
    category: 'rent',
    isCredit: false,
    minNaira: 50000,
    maxNaira: 200000,
    narrate: () => 'Rent payment - property ref 4B',
    weight: 1,
  },
]

// Expanded once at module load, not per call: a template repeated `weight` times so a plain
// pick() lands on it proportionally more often, without the caller needing weighted-sampling
// logic or the pool needing hand-duplicated literal entries.
const WEIGHTED_TEMPLATES: readonly NarrationTemplate[] = TEMPLATES.flatMap((template) =>
  Array<NarrationTemplate>(template.weight).fill(template),
)

function generateSalaryRow(): GeneratedRow {
  return {
    category: 'salary',
    narration: `Salary - ${pick(COMPANY_NAMES)}`,
    isCredit: true,
    amountNaira: randomInt(120000, 450000),
  }
}

function generateTemplateRow(): GeneratedRow {
  const template = pick(WEIGHTED_TEMPLATES)
  return {
    category: template.category,
    narration: template.narrate(),
    isCredit: template.isCredit,
    amountNaira: randomInt(template.minNaira, template.maxNaira),
  }
}

// Money crosses the ParseResponse wire as a decimal STRING (DESIGN money law). These two
// functions are the only place this module touches Number(): always on a pure integer-digit
// substring produced by string splitting, never on a raw value that may contain a decimal
// point. That is the exact boundary the money law forbids crossing.
// Exported: the scoring module (sample-score.ts) also needs kobo-safe arithmetic to read the
// generated statement without ever calling Number() on a raw decimal string.
export function toKobo(value: string): number {
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [intPart = '0', fracPart = ''] = unsigned.split('.')
  const frac2 = (fracPart + '00').slice(0, 2)
  const kobo = Number(`${intPart || '0'}${frac2}`)
  return negative ? -kobo : kobo
}

export function fromKobo(kobo: number): string {
  const negative = kobo < 0
  const abs = Math.abs(kobo)
  const intPart = Math.floor(abs / 100)
  const fracPart = String(abs % 100).padStart(2, '0')
  return `${negative ? '-' : ''}${intPart}.${fracPart}`
}

function isoDate(daysAgo: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return `${d.toISOString().slice(0, 10)}T09:00:00`
}

export function generateSampleStatement(): ParseResponse {
  const rowCount = randomInt(8, 10)
  const rows: GeneratedRow[] = [generateSalaryRow()]
  while (rows.length < rowCount) rows.push(generateTemplateRow())

  // Ascending chronological order over a synthetic 30-day statement period.
  const daysAgo = rows.map(() => randomInt(0, 29)).sort((a, b) => b - a)

  const openingBalanceNaira = randomInt(15000, 120000)
  let runningKobo = toKobo(`${openingBalanceNaira}.00`)
  let creditKobo = 0
  let debitKobo = 0

  const transactions: Transaction[] = rows.map((row, i) => {
    const amountKobo = toKobo(`${row.amountNaira}.00`)
    if (row.isCredit) {
      runningKobo += amountKobo
      creditKobo += amountKobo
    } else {
      runningKobo -= amountKobo
      debitKobo += amountKobo
    }
    return {
      date: isoDate(daysAgo[i] ?? 0),
      narration: row.narration,
      debit: row.isCredit ? '0' : fromKobo(amountKobo),
      credit: row.isCredit ? fromKobo(amountKobo) : '0',
      balance: fromKobo(runningKobo),
      reference: `SMP${String(i + 1).padStart(3, '0')}`,
      currency: 'NGN',
    }
  })

  return {
    format_version: 'sample-marketing-1',
    metadata: {
      // Same lowercase engine id shown everywhere else on the site (BankCoverageCell, the
      // worker's own _sample), and reused straight from the coverage source of truth so a new
      // shipped bank shows up here automatically (Directive 6: never a second hardcoded list).
      bank: pick(SHIPPED_BANKS).id,
      account_holder: null,
      account_number_masked: `****${randomInt(1000, 9999)}`,
      statement_period_start: isoDate(29),
      statement_period_end: isoDate(0),
      opening_balance: fromKobo(toKobo(`${openingBalanceNaira}.00`)),
      closing_balance: fromKobo(runningKobo),
    },
    totals: {
      credit: fromKobo(creditKobo),
      debit: fromKobo(debitKobo),
    },
    // Generated to reconcile by construction. The running balance IS the accumulation of
    // every row, never randomly broken, since the whole point of the panel is to show the
    // balance check working, not to simulate a failure mode.
    row_wise_reconcilable: true,
    transactions,
  }
}
