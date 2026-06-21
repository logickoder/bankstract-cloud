// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Resend } from 'resend'
import { z } from 'zod'

import { getUserId } from '@/lib/session'

const Body = z.object({ email: z.string().email() })

const resendKey = process.env.RESEND_API_KEY
const audienceId = process.env.RESEND_AUDIENCE_ID

export async function POST(req: Request): Promise<Response> {
  const userId = await getUserId()
  if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'invalid email' }, { status: 422 })

  // No Resend audience configured (dev/self-host). Accept the opt-in without persisting.
  if (!resendKey || !audienceId) {
    console.warn(`[notify] launch opt-in (no audience configured): ${parsed.data.email}`)
    return Response.json({ ok: true })
  }

  const { error } = await new Resend(resendKey).contacts.create({
    audienceId,
    email: parsed.data.email,
  })
  if (error) return Response.json({ error: 'capture failed' }, { status: 502 })
  return Response.json({ ok: true })
}
