// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'

import { getUserId } from '@/lib/session'
import { passthrough, workerFetch } from '@/lib/worker'

export async function GET() {
  const owner = await getUserId()
  if (!owner) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  return passthrough(await workerFetch(`/v1/admin/usage?owner=${encodeURIComponent(owner)}`))
}
