// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { EMAIL_FAINT, EMAIL_INK, EMAIL_LINK, EMAIL_MUTED, emailLayout } from './layout'

// NDPR closure: confirm to the user that their account and data are gone. No CTA, no link.
export function accountDeletedEmail(): { subject: string; html: string; text: string } {
  const subject = 'Your bankstract account was deleted'
  const text =
    'Your bankstract account and all associated data have been deleted. Your API keys stopped working and any subscription was cancelled. If you did not request this, email jeffery@logickoder.dev.'
  const html = emailLayout(`                <tr><td style="padding:0 0 8px;color:${EMAIL_INK};font-size:20px;font-weight:600;letter-spacing:-0.01em;">Your account was deleted</td></tr>
                <tr><td style="padding:0 0 24px;color:${EMAIL_MUTED};font-size:15px;line-height:1.6;">Your account and all associated data are gone. Your API keys stopped working and any subscription was cancelled.</td></tr>
                <tr><td style="color:${EMAIL_FAINT};font-size:13px;line-height:1.6;">If you did not request this, email <a href="mailto:jeffery@logickoder.dev" style="color:${EMAIL_LINK};">jeffery@logickoder.dev</a>.</td></tr>`)
  return { subject, html, text }
}
