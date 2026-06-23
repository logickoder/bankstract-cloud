// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// The deployed origin, the single source for canonical/OG/sitemap/robots absolute URLs. Override
// per surface with NEXT_PUBLIC_SITE_URL at build.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bankstract.logickoder.dev'
