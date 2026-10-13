// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { displayDate } from '@bankstract/format'
import { ANNUAL_DISCOUNT_PERCENT, naira, PAID_TIERS } from '@bankstract/marketing/pricing'
import { Button, cn, SegmentedRadio, tintClass } from '@bankstract/ui'
import { useState } from 'react'

import type { SubscribeResponse, SubscriptionStatusResponse } from '@/lib/worker'

type Interval = 'monthly' | 'annual'

const INTERVALS = ['monthly', 'annual'] as const

function tabClass(active: boolean): string {
  return active
    ? 'rounded-md bg-bg px-3 py-1.5 font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
    : 'rounded-md px-3 py-1.5 text-fg-secondary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none'
}

export function BillingClient({ status }: { status: SubscriptionStatusResponse | null }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [interval, setBillingInterval] = useState<Interval>('monthly')

  async function subscribe(tier: string) {
    setBusy(tier)
    setError('')
    const res = await fetch('/api/billing/init', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tier, interval }),
    })
    if (!res.ok) {
      setBusy(null)
      setError('Could not start checkout. Try again.')
      return
    }
    const { authorization_url } = (await res.json()) as SubscribeResponse
    window.location.href = authorization_url
  }

  if (status?.status === 'active') {
    const current = PAID_TIERS.find((t) => t.id === status.tier)
    return (
      <section
        className={cn(
          'mt-8 max-w-md rounded-lg p-6 sm:p-8',
          tintClass[current?.tint ?? 'yellow'],
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs text-fg-tertiary">current plan</p>
          <span className="rounded-full bg-fg px-3 py-1 font-mono text-xs text-bg">active</span>
        </div>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.02em]">
          {current?.name ?? status.tier ?? 'Active plan'}
        </h2>
        <p className="mt-2 text-fg-secondary">Live keys parse.</p>
        {status.current_period_end ? (
          <p className="mt-1 text-sm text-fg-secondary">
            Renews <span className="font-mono">{displayDate(status.current_period_end)}</span>.
          </p>
        ) : null}
      </section>
    )
  }

  return (
    <div className="mt-8">
      <SegmentedRadio
        options={INTERVALS}
        value={interval}
        onChange={setBillingInterval}
        ariaLabel="Billing interval"
        className="mb-6 inline-flex rounded-lg border border-border p-1 text-sm"
        optionClassName={tabClass}
        renderOption={(iv) =>
          iv === 'monthly' ? (
            'Monthly'
          ) : (
            <>
              Annual <span className="text-fg-tertiary">-{ANNUAL_DISCOUNT_PERCENT}%</span>
            </>
          )
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {PAID_TIERS.map((t) => (
          <div
            key={t.id}
            className={cn('relative flex flex-col rounded-lg p-6', tintClass[t.tint])}
          >
            {t.highlight ? (
              <span className="absolute top-6 right-6 rounded-full bg-fg px-3 py-1 font-mono text-xs text-bg">
                popular
              </span>
            ) : null}
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">{t.name}</h2>
            <div className="mt-3 font-mono text-3xl tracking-[-0.04em]">
              ₦{naira(interval === 'annual' ? t.annual : t.monthly)}
            </div>
            <div className="text-xs text-fg-secondary">
              {interval === 'annual' ? 'per year' : 'per month'}
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm text-fg-secondary">
              <li>
                <span className="font-mono">{naira(t.includedParses)}</span> parses/mo included
              </li>
              <li>
                <span className="font-mono">₦{t.overageNaira}</span>/parse over the cap
              </li>
            </ul>
            <Button
              size="sm"
              className="mt-6 self-start"
              disabled={busy !== null}
              onClick={() => void subscribe(t.id)}
            >
              {busy === t.id ? 'Starting...' : 'Subscribe'}
            </Button>
          </div>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-error">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-sm text-fg-tertiary">
        Payment runs on Paystack. Overage bills at the end of each cycle.
      </p>
    </div>
  )
}
