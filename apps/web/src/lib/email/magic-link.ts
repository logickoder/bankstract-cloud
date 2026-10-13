// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { EMAIL_FAINT, EMAIL_INK, EMAIL_LINK, EMAIL_MUTED, emailLayout } from './layout'

// The sign-in link email. Markup comes from the shared shell (layout.ts). `url` is Better Auth
// generated, not user input. Plain text stays as the multipart fallback. Voice: period-split, no marketing words.
interface MagicLinkInput {
  url: string
}

export function magicLinkEmail({ url }: MagicLinkInput): {
  subject: string
  html: string
  text: string
} {
  const subject = 'Sign in to bankstract'
  const text = `Sign in to bankstract. The link expires in 15 minutes.\nIf you did not request this, ignore this email.\n\n${url}`
  const html = emailLayout(`                <tr><td style="padding:0 0 8px;color:${EMAIL_INK};font-size:20px;font-weight:600;letter-spacing:-0.01em;">Sign in to bankstract</td></tr>
                <tr><td style="padding:0 0 24px;color:${EMAIL_MUTED};font-size:15px;line-height:1.6;">Tap the button below. The link expires in 15 minutes.</td></tr>
                <tr><td style="padding:0 0 28px;">
                  <a href="${url}" style="display:inline-block;background:${EMAIL_INK};color:#fcfbf9;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">Sign in</a>
                </td></tr>
                <tr><td style="padding:0 0 8px;color:${EMAIL_FAINT};font-size:13px;line-height:1.6;">If you did not request this, ignore this email.</td></tr>
                <tr><td style="color:${EMAIL_FAINT};font-size:13px;line-height:1.6;word-break:break-all;">Or paste this link: <a href="${url}" style="color:${EMAIL_LINK};">${url}</a></td></tr>`)
  return { subject, html, text }
}
