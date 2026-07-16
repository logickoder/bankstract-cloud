// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'

import { requireOwner } from '@/lib/session'
import { passthrough, workerFetch } from '@/lib/worker'

// Provision or regenerate the owner's single test key. The worker revokes any existing active test
// key and issues a fresh one, returning the raw key exactly once. Owner is injected server-side.
export async function POST() {
  const owner = await requireOwner()
  if (owner instanceof NextResponse) return owner

  return passthrough(
    await workerFetch('/v1/keys/test', {
      method: 'POST',
      body: JSON.stringify({ owner }),
    }),
  )
}
