// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Funnel + external destinations. Auth (sign-in / sign-up) is same-origin in the merged web, so
// signup defaults to the relative /sign-up; NEXT_PUBLIC_APP_URL can re-point it at a separately
// deployed dashboard.
const DEMO =
  process.env.NEXT_PUBLIC_DEMO_URL ?? 'https://bankstract.logickoder.dev/demo'
const DOCS =
  process.env.NEXT_PUBLIC_DOCS_URL ?? 'https://bankstract.logickoder.dev/docs'
const APP = process.env.NEXT_PUBLIC_APP_URL ?? '/sign-up'

export const links = {
  demo: DEMO,
  docs: DOCS,
  signup: APP,
  pricing: '/pricing',
  privacy: '/privacy',
  // Same-origin in the merged web (marketing + dashboard are one app). Relative so it resolves to
  // the deployed /sign-in without a build-time URL.
  signin: '/sign-in',
  engine: 'https://github.com/logickoder/bankstract',
  cloud: 'https://github.com/logickoder/bankstract-cloud',
  stars: 'https://github.com/logickoder/bankstract-cloud/stargazers',
  selfHost:
    'https://github.com/logickoder/bankstract-cloud/blob/main/infra/README.md',
  security:
    'https://github.com/logickoder/bankstract-cloud/blob/main/SECURITY.md',
  // Brand/person credit goes to the personal site; code/repo links go to GitHub.
  owner: 'https://logickoder.dev',
  sales: 'mailto:jeffery@logickoder.dev?subject=bankstract%20Enterprise',
  sponsoredBank: 'mailto:jeffery@logickoder.dev?subject=bankstract%20sponsored%20bank',
} as const
