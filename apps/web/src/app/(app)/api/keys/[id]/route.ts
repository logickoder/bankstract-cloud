// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'

import { getUserId } from '@/lib/session'
import { type KeyInfo, workerFetch } from '@/lib/worker'

// The worker's DELETE doesn't check owner, so we enforce isolation here: only revoke a
// key that belongs to the signed-in user.
export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const owner = await getUserId()
  if (!owner) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { id } = await ctx.params
  const listRes = await workerFetch(`/v1/keys?owner=${encodeURIComponent(owner)}`)
  if (!listRes.ok) return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  const { keys } = (await listRes.json()) as { keys: KeyInfo[] }
  if (!keys.some((k) => k.id === id)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const res = await workerFetch(`/v1/keys/${encodeURIComponent(id)}`, { method: 'DELETE' })
  return new NextResponse(null, { status: res.status })
}
