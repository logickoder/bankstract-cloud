// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireUser } from '@/lib/session'
import { passthrough, workerFetch } from '@/lib/worker'

const initSchema = z.object({
  tier: z.enum(['starter', 'growth', 'scale']),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
})

// Start a Paystack subscription checkout. owner + email come from the session; the worker
// holds the Paystack secret and returns the inline-checkout params we hand back to the client.
export async function POST(request: Request) {
  const user = await requireUser()
  if (user instanceof NextResponse) return user

  const parsed = initSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid tier' }, { status: 422 })

  // Paystack returns the user here after payment; the billing page re-reads status on load.
  const base = process.env.BETTER_AUTH_URL ?? new URL(request.url).origin
  const callback_url = `${base}/dashboard/billing`

  return passthrough(
    await workerFetch('/v1/admin/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        owner: user.id,
        email: user.email,
        tier: parsed.data.tier,
        interval: parsed.data.interval,
        callback_url,
      }),
    }),
  )
}
