// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// The one transactional email the product sends (sign-in link). Inline-CSS HTML because email
// clients strip <style>; brand colours as literals. `url` is Better Auth generated, not user
// input. Plain text stays as the multipart fallback. Voice: period-split, no marketing words.
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
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#0a0a0a;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
      <tr>
        <td align="center">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="width:440px;max-width:100%;text-align:left;">
            <tr><td style="padding:0 0 28px;">
              <span style="color:#fafaf9;font-size:20px;font-weight:700;letter-spacing:-0.01em;">bankstract</span>
            </td></tr>
            <tr><td style="padding:0 0 8px;color:#fafaf9;font-size:17px;font-weight:600;">Sign in to bankstract</td></tr>
            <tr><td style="padding:0 0 24px;color:#a1a1aa;font-size:15px;line-height:1.6;">Tap the button below. The link expires in 15 minutes.</td></tr>
            <tr><td style="padding:0 0 28px;">
              <a href="${url}" style="display:inline-block;background:#d2691e;color:#0a0a0a;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">Sign in</a>
            </td></tr>
            <tr><td style="padding:0 0 8px;color:#71717a;font-size:13px;line-height:1.6;">If you did not request this, ignore this email.</td></tr>
            <tr><td style="color:#71717a;font-size:13px;line-height:1.6;word-break:break-all;">Or paste this link: <a href="${url}" style="color:#d2691e;">${url}</a></td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  return { subject, html, text }
}
