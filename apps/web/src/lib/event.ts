// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { AccentTheme } from '@bankstract/ui'

// A time-boxed event skin: red accent and a bubble, until the cutoff, then back to the default with
// no redeploy. The pages are statically prerendered and NEXT_PUBLIC_* is inlined at build time, so
// neither can check the date. A blocking script in <head> does, before first paint (no flash), and
// the bubble is always in the markup but hidden by CSS unless <html data-event> is set.
export const EVENT = {
  id: 'zecathon',
  // One line, plain fact. It names the association without claiming a partnership or a result.
  banner: 'Zenith Zecathon 6.0 entry',
  theme: 'red' satisfies AccentTheme,
  // Midnight at the start of the 17th in Lagos (UTC+1, no DST) = through the end of the 16th.
  endsAt: '2026-10-17T00:00:00+01:00',
} as const

export function isEventActive(now: number): boolean {
  return now < Date.parse(EVENT.endsAt)
}

// The accent for code that runs on the server per request (email), where the boot script cannot
// reach. Static surfaces (the OG card) keep the build default: crawlers cache them anyway.
export function activeAccentTheme(now: number, base: AccentTheme): AccentTheme {
  return isEventActive(now) ? EVENT.theme : base
}

// Runs before paint. The date logic is inlined from isEventActive, and the test evaluates this
// string to keep the two in step. try/catch: a script error must never break the page.
export function eventBootScript(): string {
  return `(function(){try{if(Date.now()<Date.parse(${JSON.stringify(EVENT.endsAt)})){var d=document.documentElement;d.setAttribute('data-theme',${JSON.stringify(EVENT.theme)});d.setAttribute('data-event',${JSON.stringify(EVENT.id)})}}catch(e){}})()`
}
