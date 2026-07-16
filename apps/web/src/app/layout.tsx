// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata } from '@bankstract/seo'
import { GrainFilter } from '@bankstract/ui'
import { fraunces, inter, jetbrains } from '@bankstract/ui/fonts'
import type { Viewport } from 'next'
import Script from 'next/script'

import './globals.css'

// Dark UI: declare the theme-color so the browser chrome (mobile address bar) matches.
export const viewport: Viewport = { themeColor: '#0a0a0a' }

// Cloudflare Web Analytics: cookieless, no PII, no consent banner. Only loads when the token is
// set (prod), so dev + e2e stay clean. Our box is Caddy-fronted (not CF-proxied); the JS beacon
// works on any origin. Keeps the /privacy "no analytics cookies" claim true.
const CF_ANALYTICS_TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN

// Shared shell for every surface (marketing /, demo /demo, dashboard /app). Per-route-group
// layouts add their own JSON-LD + metadata; this sets the metadataBase + a sensible default.
export const metadata = buildMetadata({
  title: 'bankstract: bank statement parsing API for Nigerian banks',
  description:
    'Parse Nigerian bank statement PDFs into clean transactions over one API call. Free browser demo, developer dashboard, and OSS self-host.',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        <GrainFilter />
        {children}
        {CF_ANALYTICS_TOKEN ? (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: CF_ANALYTICS_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  )
}
