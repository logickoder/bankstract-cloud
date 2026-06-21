<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- Copyright (C) 2026 Jeffery Orazulike -->

# Changelog

All notable changes to bankstract-cloud. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Auth provider changed from Clerk to Better Auth (owner directive 2026-06-21). Users + sessions live in our own SQLite (`apps/app/data/auth.db`), not an external auth SaaS. Sign-in is Google/GitHub OAuth + email magic-link (Resend); no password/MFA yet. Removes the login-path subprocessor (NDPR/procurement posture), removes the cost ceiling, and keeps the self-host bundle fully self-contained.
- Payments processor changed from Stripe to Paystack. NGN-first pricing (monthly subscription tiers, see PRD.md § Pricing). International USD surface deferred until the first non-Nigerian lead. Owner directive 2026-06-21: Stripe requires Atlas (US LLC + EIN) for Nigerian merchants, the ICP is Nigerian fintechs that need FIRS-compliant NGN invoices, and the owner already holds a Paystack account.
- Free demo cap moved from 10 parses/hour per IP to 50 parses/month per IP (PRD § Pricing).
- Free demo outputs are watermarked (`apps/worker/.../watermark.py`): CSV gets a 4-line `#` comment banner, JSON gets a `_demo` envelope. Paid/test keys and self-host (direct engine) pass through clean. Additive only, no row or value changes. Demo download UI discloses it.

### Pending (tracked follow-ups for the payments pivot)

- Worker billing migration: `apps/worker/src/bankstract_cloud/billing.py` Stripe SDK to Paystack HMAC-SHA512 webhook verification; new `usage.py` (per-key metering + Paystack Invoices); `auth.py` subscription-state gate returning `402 subscription_inactive`.
- Dashboard checkout: `apps/app` Paystack inline checkout replacing Stripe Checkout, `POST /api/billing/init`, transaction verify polling.
- `.env` + config: swap `STRIPE_*` for `PAYSTACK_*` once `billing.py` reads them.
