// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getUserId } from '@/lib/session'
import { passthrough, workerFetch } from '@/lib/worker'

const createSchema = z.object({
  name: z.string().min(1).max(120),
  env: z.enum(['test', 'live']).default('test'),
})

export async function GET() {
  const owner = await getUserId()
  if (!owner) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  return passthrough(await workerFetch(`/v1/keys?owner=${encodeURIComponent(owner)}`))
}

export async function POST(request: Request) {
  const owner = await getUserId()
  if (!owner) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid request' }, { status: 422 })

  return passthrough(
    await workerFetch('/v1/keys', {
      method: 'POST',
      body: JSON.stringify({ ...parsed.data, owner }),
    }),
  )
}
