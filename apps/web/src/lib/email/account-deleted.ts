// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// NDPR closure: confirm to the user that their account and data are gone. No CTA, no link.
export function accountDeletedEmail(): { subject: string; html: string; text: string } {
  const subject = 'Your bankstract account was deleted'
  const text =
    'Your bankstract account and all associated data have been deleted. Your API keys stopped working and any subscription was cancelled. If you did not request this, email jeffery@logickoder.dev.'
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
            <tr><td style="padding:0 0 8px;color:#fafaf9;font-size:17px;font-weight:600;">Your account was deleted</td></tr>
            <tr><td style="padding:0 0 24px;color:#a1a1aa;font-size:15px;line-height:1.6;">Your account and all associated data are gone. Your API keys stopped working and any subscription was cancelled.</td></tr>
            <tr><td style="color:#71717a;font-size:13px;line-height:1.6;">If you did not request this, email <a href="mailto:jeffery@logickoder.dev" style="color:#d2691e;">jeffery@logickoder.dev</a>.</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
  return { subject, html, text }
}
