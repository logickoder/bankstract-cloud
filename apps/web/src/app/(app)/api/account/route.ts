// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { user, verification } from '@/lib/db/schema'
import { requireUser } from '@/lib/session'
import { workerFetch } from '@/lib/worker'

// Right to erasure (NDPR, /privacy). Worker first: it cancels any live Paystack subscription and
// clears worker-side rows. If that fails we abort, so the account is never deleted while a live
// charge or worker data survives. Only then do we delete the auth records.
export async function DELETE() {
  const u = await requireUser()
  if (u instanceof NextResponse) return u

  const res = await workerFetch(`/v1/admin/owner?owner=${encodeURIComponent(u.id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'could not erase account data' }, { status: 502 })
  }

  // Deleting the user row cascades sessions + accounts (FK onDelete cascade). verification rows
  // key on the email identifier, not userId, so clear them explicitly.
  await db.delete(verification).where(eq(verification.identifier, u.email))
  await db.delete(user).where(eq(user.id, u.id))

  return NextResponse.json({ ok: true })
}
