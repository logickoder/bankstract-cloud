// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Shared shell for transactional email. Inline CSS because clients strip <style>; the site's paper
// and ink tokens as literals (packages/ui/src/theme.css). `color-scheme: light` stops clients that
// auto-invert from turning the paper card dark. Body rows are caller-supplied <tr> markup.
export const EMAIL_INK = '#14161f'
export const EMAIL_MUTED = '#4f5360'
export const EMAIL_FAINT = '#6b6f7c'
export const EMAIL_LINK = '#a8500f'
const PAPER = '#fcfbf9'
const SURROUND = '#f4f2ee'
const BORDER = '#e4e1da'
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export function emailLayout(rows: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
  </head>
  <body style="margin:0;background:${SURROUND};padding:40px 16px;font-family:${SANS};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background:${PAPER};border:1px solid ${BORDER};border-radius:12px;text-align:left;">
            <tr><td style="padding:32px 32px 0;">
              <span style="color:${EMAIL_INK};font-family:${MONO};font-size:15px;font-weight:600;">bankstract</span>
            </td></tr>
            <tr><td style="padding:28px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${rows}
              </table>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
