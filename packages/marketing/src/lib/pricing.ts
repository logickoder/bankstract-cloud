// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Mirrors PRD.md § Pricing (canonical). Directive 6: the pricing section renders from
// this data, never a hardcoded table in the component. NGN, monthly subscriptions.

export interface FreeTier {
  name: string
  detail: string
}

// Annual prepay discount, in whole percent. Annual price = monthly x 12 x (100 - this) / 100, in
// integer math so the naira figures never pick up float noise.
export const ANNUAL_DISCOUNT_PERCENT = 15

export type TierId = 'starter' | 'growth' | 'scale'

// The numbers. Everything a screen shows is derived from these, so a price changes in one place.
// `includedParses` and `overageNaira` must match apps/worker/src/bankstract_cloud/tiers.py (the
// billing source of truth); data.test.ts reads that file and fails if they drift. The monthly naira
// price has no worker twin: it lives in the Paystack plan, so this is its only code definition.
interface TierDef {
  id: TierId
  name: string
  monthly: number
  includedParses: number
  overageNaira: number
  sla: string
  highlight: boolean
}

const TIER_DEFS: readonly TierDef[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 9_500,
    includedParses: 1_000,
    overageNaira: 15,
    sla: 'Email support',
    highlight: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 35_000,
    includedParses: 10_000,
    overageNaira: 12,
    sla: 'Priority email + Discord, 99% target',
    highlight: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    monthly: 150_000,
    includedParses: 100_000,
    overageNaira: 8,
    sla: 'Dedicated Slack, 99.5% SLA',
    highlight: false,
  },
]

// Grouped digits, fixed locale so server and browser render the same string.
export function naira(amount: number): string {
  return amount.toLocaleString('en-US')
}

export interface PaidTier {
  id: TierId
  name: string
  /** Monthly price in naira. */
  monthly: number
  /** Annual prepay price in naira. */
  annual: number
  includedParses: number
  overageNaira: number
  /** Display strings, derived from the numbers above. */
  price: string
  cap: string
  overage: string
  sla: string
  highlight: boolean
}

export const PAID_TIERS: readonly PaidTier[] = TIER_DEFS.map((t) => ({
  ...t,
  annual: (t.monthly * 12 * (100 - ANNUAL_DISCOUNT_PERCENT)) / 100,
  price: `₦${naira(t.monthly)}`,
  cap: `${naira(t.includedParses)} parses/mo`,
  overage: `₦${t.overageNaira}/parse`,
}))

export const FREE_TIERS: readonly FreeTier[] = [
  { name: 'Self-host', detail: 'Run the AGPL-3.0 stack on your own infra. Unlimited.' },
  { name: 'Free demo', detail: '50 parses/month per IP. Anonymous, Turnstile-gated, watermarked.' },
]

export const ENTERPRISE = {
  name: 'Enterprise',
  band: '₦500k to ₦5M/mo',
  detail: 'Unlimited parses, per-key rate limits, 99.9% SLA, NDPR audit support.',
} as const

export const ANNUAL_NOTE = `Annual prepay: ${ANNUAL_DISCOUNT_PERCENT}% off across all paid tiers.`
