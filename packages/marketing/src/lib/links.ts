// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Funnel + external destinations. Auth (sign-in / sign-up) is same-origin in the merged web, so
// signup defaults to the relative /sign-up; NEXT_PUBLIC_APP_URL can re-point it at a separately
// deployed dashboard.
// Root-relative by default, so every environment links to its own origin (local dev stays on
// localhost, prod on its domain). Set the env var only to point at a different deployment.
const DEMO = process.env.NEXT_PUBLIC_DEMO_URL ?? '/demo'
const DOCS = process.env.NEXT_PUBLIC_DOCS_URL ?? '/docs'
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
  ownerGithub: 'https://github.com/logickoder',
  ownerX: 'https://x.com/logickoder',
  ownerLinkedin: 'https://www.linkedin.com/in/logickoder',
  license: 'https://github.com/logickoder/bankstract-cloud/blob/main/LICENSE',
  sales: 'mailto:jeffery@logickoder.dev?subject=bankstract%20Enterprise',
  sponsoredBank: 'mailto:jeffery@logickoder.dev?subject=bankstract%20sponsored%20bank',
} as const
