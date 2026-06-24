// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Funnel + external destinations. apps/app (dashboard + billing) has shipped in-repo but is
// not deployed yet, so APP (signup) falls back to the demo; set NEXT_PUBLIC_APP_URL to the
// deployed dashboard URL to re-point signup off the demo.
const DEMO =
  process.env.NEXT_PUBLIC_DEMO_URL ?? 'https://bankstract.logickoder.dev/demo'
const DOCS =
  process.env.NEXT_PUBLIC_DOCS_URL ?? 'https://bankstract.logickoder.dev/docs'
const APP = process.env.NEXT_PUBLIC_APP_URL ?? DEMO

export const links = {
  demo: DEMO,
  docs: DOCS,
  signup: APP,
  engine: 'https://github.com/logickoder/bankstract',
  cloud: 'https://github.com/logickoder/bankstract-cloud',
  selfHost:
    'https://github.com/logickoder/bankstract-cloud/blob/main/infra/README.md',
  security:
    'https://github.com/logickoder/bankstract-cloud/blob/main/SECURITY.md',
  // Brand/person credit goes to the personal site; code/repo links go to GitHub.
  owner: 'https://logickoder.dev',
  sales: 'mailto:jeffery@logickoder.dev?subject=bankstract%20Enterprise',
  // Paid tiers are not live yet: Paystack KYC is still pending (billing is built in the worker
  // but no live charges). Paid-tier CTAs collect interest here; route them to app checkout once
  // KYC approves and the dashboard is deployed.
  waitlist: 'mailto:jeffery@logickoder.dev?subject=bankstract%20waitlist',
} as const
