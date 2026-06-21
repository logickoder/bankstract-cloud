// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getUser } from '@/lib/session'
import { passthrough, workerFetch } from '@/lib/worker'

const initSchema = z.object({ tier: z.enum(['starter', 'growth', 'scale']) })

// Start a Paystack subscription checkout. owner + email come from the session; the worker
// holds the Paystack secret and returns the inline-checkout params we hand back to the client.
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const parsed = initSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid tier' }, { status: 422 })

  return passthrough(
    await workerFetch('/v1/admin/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ owner: user.id, email: user.email, tier: parsed.data.tier }),
    }),
  )
}
