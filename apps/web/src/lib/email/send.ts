// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Resend } from 'resend'

// One place to send a transactional email. No Resend key (dev/test) => no-op, so nothing tries
// to reach the network. The magic-link path in auth.ts keeps its own dev-log fallback; this is
// for the simpler fire-and-forget notifications.
const key = process.env.RESEND_API_KEY
const resend = key ? new Resend(key) : null
const FROM = 'bankstract <noreply@updates.logickoder.dev>'

export async function sendEmail(
  opts: {
  to: string
  subject: string
  html: string
  text: string
  },
  fallback?: () => Promise<void>
): Promise<void> {
  if (!resend) {
    await fallback?.()
    return
  }
  await resend.emails.send({ from: FROM, ...opts })
}
