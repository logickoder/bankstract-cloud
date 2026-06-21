// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Funnel + external destinations. apps/app does not exist yet, so APP (signup) points
// at the demo for now; re-point NEXT_PUBLIC_APP_URL when the dashboard ships.
const DEMO =
  process.env.NEXT_PUBLIC_DEMO_URL ?? "https://bankstract.logickoder.dev/demo";
const DOCS =
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://bankstract.logickoder.dev/docs";
const APP = process.env.NEXT_PUBLIC_APP_URL ?? DEMO;

export const links = {
  demo: DEMO,
  docs: DOCS,
  signup: APP,
  engine: "https://github.com/logickoder/bankstract",
  cloud: "https://github.com/logickoder/bankstract-cloud",
  selfHost:
    "https://github.com/logickoder/bankstract-cloud/blob/main/infra/README.md",
  security:
    "https://github.com/logickoder/bankstract-cloud/blob/main/SECURITY.md",
  // Brand/person credit goes to the personal site; code/repo links go to GitHub.
  owner: "https://logickoder.dev",
  sales: "mailto:jeffery@logickoder.dev?subject=bankstract%20Enterprise",
  // Paid tiers are not live (Paystack KYC pending). Paid-tier CTAs collect interest here;
  // swap to the Resend audience when apps/app + Paystack land.
  waitlist: "mailto:jeffery@logickoder.dev?subject=bankstract%20waitlist",
} as const;
