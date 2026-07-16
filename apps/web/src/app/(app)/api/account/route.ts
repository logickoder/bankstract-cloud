// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'
import { account, session, user, verification } from '@/lib/db/schema'
import { accountDeletedEmail } from '@/lib/email/account-deleted'
import { sendEmail } from '@/lib/email/send'
import { requireUser } from '@/lib/session'
import { workerFetch } from '@/lib/worker'

// Right to erasure (NDPR, /privacy). Worker first: it cancels any live Paystack subscription and
// clears worker-side rows. If that fails we abort, so the account is never deleted while a live
// charge or worker data survives. Only then do we delete the auth records. The whole endpoint is
// idempotent (worker purge + Paystack disable are no-ops when already done), so a retry after a
// partial failure converges.
export async function DELETE() {
  const u = await requireUser()
  if (u instanceof NextResponse) return u

  // The worker cancels the subscription via two sequential 15s Paystack calls, then purges. Give
  // it well over workerFetch's 4s default so a slow Paystack cancel does not abort mid-erasure and
  // strand the account (worker data gone, auth rows kept).
  const res = await workerFetch(`/v1/admin/owner?owner=${encodeURIComponent(u.id)}`, {
    method: 'DELETE',
    signal: AbortSignal.timeout(35_000),
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'could not erase account data' }, { status: 502 })
  }

  // Delete the auth records atomically. Explicit child deletes (not just FK cascade) guarantee
  // sessions, OAuth accounts + their tokens, and magic-link tokens are gone even if SQLite FK
  // enforcement is off on the connection.
  await db.batch([
    db.delete(session).where(eq(session.userId, u.id)),
    db.delete(account).where(eq(account.userId, u.id)),
    db.delete(verification).where(eq(verification.identifier, u.email)),
    db.delete(user).where(eq(user.id, u.id)),
  ])

  // NDPR closure. Fire-and-forget: a mail failure must not fail the erasure.
  void sendEmail({ to: u.email, ...accountDeletedEmail() }).catch(() => {})

  return NextResponse.json({ ok: true })
}
