// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Badge, Button, Card } from '@bankstract/ui'
import { useState } from 'react'

import type { SubscribeResponse, SubscriptionStatusResponse } from '@/lib/worker'

// Tier economics mirror PRD § Pricing. Naira renders in JetBrains Mono (voice rule).
const TIERS = [
  { id: 'starter', name: 'Starter', price: '9,500', cap: '1,000', overage: '15' },
  { id: 'growth', name: 'Growth', price: '35,000', cap: '10,000', overage: '12' },
  { id: 'scale', name: 'Scale', price: '150,000', cap: '100,000', overage: '8' },
] as const

export function BillingClient({ status }: { status: SubscriptionStatusResponse | null }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function subscribe(tier: string) {
    setBusy(tier)
    setError('')
    const res = await fetch('/api/billing/init', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tier }),
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
    const current = TIERS.find((t) => t.id === status.tier)
    return (
      <Card className="mt-8 max-w-md">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-fg">
            {current?.name ?? status.tier ?? 'Active plan'}
          </h2>
          <Badge tone="success">active</Badge>
        </div>
        <p className="mt-2 text-sm text-fg-secondary">
          {current ? (
            <>
              <span className="font-mono">₦{current.price}</span>/mo. Live keys parse.
            </>
          ) : (
            'Live keys parse.'
          )}
        </p>
        {status.current_period_end ? (
          <p className="mt-1 text-sm text-fg-tertiary">
            Renews <span className="font-mono">{status.current_period_end.slice(0, 10)}</span>.
          </p>
        ) : null}
      </Card>
    )
  }

  return (
    <div className="mt-8">
      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <h2 className="font-display text-lg font-semibold text-fg">{t.name}</h2>
            <div className="mt-2 font-mono text-2xl text-fg">₦{t.price}</div>
            <div className="text-xs text-fg-tertiary">per month</div>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm text-fg-secondary">
              <li>
                <span className="font-mono">{t.cap}</span> parses/mo included
              </li>
              <li>
                <span className="font-mono">₦{t.overage}</span>/parse over the cap
              </li>
            </ul>
            <Button
              size="sm"
              className="mt-6"
              disabled={busy !== null}
              onClick={() => void subscribe(t.id)}
            >
              {busy === t.id ? 'Starting...' : 'Subscribe'}
            </Button>
          </Card>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}
      <p className="mt-4 text-sm text-fg-tertiary">
        Payment runs on Paystack. Overage bills at the end of each cycle.
      </p>
    </div>
  )
}
