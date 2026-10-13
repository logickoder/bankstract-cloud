// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BillingClient } from '@/components/BillingClient'
import { PageHeading } from '@/components/PageHeading'
import { Unavailable } from '@/components/Unavailable'
import { fetchBillingStatus } from '@/lib/dashboard-data'

export default async function BillingPage() {
  const status = await fetchBillingStatus()
  return (
    <div>
      <PageHeading
        title="Billing"
        subtitle={
          status === null || status.status === 'active'
            ? 'Your plan and renewal. Billed in naira via Paystack.'
            : 'NGN subscriptions via Paystack. Pick a tier, pay, your live keys activate. Test keys stay free.'
        }
      />
      {status === null ? <Unavailable what="Your plan is" /> : <BillingClient status={status} />}
    </div>
  )
}
