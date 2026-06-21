// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Card } from '@bankstract/ui'

import { NotifyForm } from '@/components/NotifyForm'
import { PageHeading } from '@/components/PageHeading'
import { getUser } from '@/lib/session'

export default async function BillingPage() {
  const user = await getUser()
  return (
    <div className="max-w-2xl">
      <PageHeading
        title="Billing"
        subtitle="Paid tiers launch soon. You'll manage subscription, invoices, and payment method here. For now: free tier, no card required."
      />

      <Card className="mt-8">
        <h2 className="font-display text-lg font-semibold text-fg">Notify me on launch</h2>
        <p className="mt-2 text-sm text-fg-secondary">
          One email when paid tiers go live. No other use.
        </p>
        <NotifyForm defaultEmail={user?.email ?? ''} />
      </Card>
    </div>
  )
}
