// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// A relative href ('/pricing') is a route in THIS Next app, so it should client-navigate via
// next/link instead of a full document load. Absolute URLs (http, mailto) and cross-app paths
// (e.g. /docs, served by a separate Cloudflare Pages project behind the same Caddy) must stay a
// plain <a> full navigation - the caller signals those with `reload`.
export function isInternalHref(href: string | undefined, reload?: boolean): href is string {
  return !reload && typeof href === 'string' && href.startsWith('/')
}
