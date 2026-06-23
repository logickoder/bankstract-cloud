// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BillingClient } from '@/components/BillingClient'
import { PageHeading } from '@/components/PageHeading'
import { fetchBillingStatus } from '@/lib/dashboard-data'

export default async function BillingPage() {
  const status = await fetchBillingStatus()
  return (
    <div>
      <PageHeading
        title="Billing"
        subtitle="NGN subscriptions via Paystack. Pick a tier, pay, your live keys activate. Test keys stay free."
      />
      <BillingClient status={status} />
    </div>
  )
}
