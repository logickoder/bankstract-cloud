// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'

import { requireOwner } from '@/lib/session'
import { passthrough, workerFetch } from '@/lib/worker'

export async function GET() {
  const owner = await requireOwner()
  if (owner instanceof NextResponse) return owner
  return passthrough(await workerFetch(`/v1/admin/usage?owner=${encodeURIComponent(owner)}`))
}
