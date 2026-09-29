# Frontend

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, shadcn/ui + Magic UI. Visual rules live in [`DESIGN.md`](../../DESIGN.md). Do not duplicate them.

## One runtime, separate surfaces

- `apps/web` is the prod runtime: marketing `/`, demo `/demo`, dashboard `/dashboard` + `/sign-in` + `/api/*`, as route groups (`(marketing)`, `(demo)`, `(app)`) with no URL prefix. One Next process keeps RAM near 300MB on the 4GB box instead of 3x.
- Surface code lives in packages: `packages/marketing`, `packages/demo`. `apps/marketing` and `apps/demo` are thin shells re-exporting them, so any surface extracts back to a standalone app.
- `apps/demo` is the second deploy target (the public `infra/` bundle). `apps/marketing` stays extractable but is off the prod path.
- `apps/docs` is its own app: Fumadocs is app-root-bound (`createMDX` reads `source.config.ts` from the app root), so it cannot be a package. It deploys to Cloudflare Pages behind same-domain `/docs` (Next basePath + Caddy proxy).
- Shared: `packages/ui` (shadcn), `packages/seo` (metadata, robots, OG), `packages/statement-table` (the parsed-statement table), `packages/format` (money and date display), `packages/types` (wire types).
- Keep surfaces decoupled. Touching one to "fix" another is forbidden. See [workflow](workflow.md).

## Auth, bot checks, billing UI

- Better Auth, dashboard route group only. Self-hosted: users and sessions in the app's own SQLite (Drizzle + libSQL, `apps/web/data/auth.db`, gitignored). Google/GitHub OAuth plus email magic-link via Resend. No passwords. The demo is anonymous.
- Cloudflare Turnstile gates the demo upload (`packages/demo`). The worker verifies the token.
- Paystack UI is dashboard-only and proxies through the worker. See [billing](billing.md).

## Components

- React Server Components by default. `'use client'` only when needed.
- Prefer named exports.
- The reconciliation badge and tip in `TransactionTable` come from the response's `reconciliation` block, never from a bank name.
