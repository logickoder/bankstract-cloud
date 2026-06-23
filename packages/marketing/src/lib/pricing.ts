// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Mirrors PRD.md § Pricing (canonical). Directive 6: the pricing section renders from
// this data, never a hardcoded table in the component. NGN, monthly subscriptions.

export interface FreeTier {
  name: string
  detail: string
}

export interface PaidTier {
  name: string
  price: string
  cap: string
  overage: string
  sla: string
  highlight: boolean
}

export const FREE_TIERS: readonly FreeTier[] = [
  { name: 'Self-host', detail: 'Run the AGPL-3.0 stack on your own infra. Unlimited.' },
  { name: 'Free demo', detail: '50 parses/month per IP. Anonymous, Turnstile-gated, watermarked.' },
]

export const PAID_TIERS: readonly PaidTier[] = [
  {
    name: 'Starter',
    price: '₦9,500',
    cap: '1,000 parses/mo',
    overage: '₦15/parse',
    sla: 'Email support',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '₦35,000',
    cap: '10,000 parses/mo',
    overage: '₦12/parse',
    sla: 'Priority email + Discord, 99% target',
    highlight: true,
  },
  {
    name: 'Scale',
    price: '₦150,000',
    cap: '100,000 parses/mo',
    overage: '₦8/parse',
    sla: 'Dedicated Slack, 99.5% SLA',
    highlight: false,
  },
]

export const ENTERPRISE = {
  name: 'Enterprise',
  band: '₦500k to ₦5M/mo',
  detail: 'Unlimited parses, per-key rate limits, 99.9% SLA, NDPR audit support.',
} as const

export const ANNUAL_NOTE = 'Annual prepay: 15% off across all paid tiers.'
