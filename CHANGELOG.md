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

### Added

- Worker Paystack billing: `paystack.py` (HMAC-SHA512 webhook verify + subscription init + overage invoice), `subscriptions.py` (owner-keyed state store + webhook dispatch, deduped by event), `usage.py` + `tiers.py` (overage metering against the tier cap). Endpoints in `routes/billing.py` (subscribe / status / charge-overage / webhook). The Stripe SDK and `STRIPE_*` config are removed.
- Live-key `402 subscription_inactive` gate in `routes/parse.py`: a `bsk_live_` key parses only under an active subscription; test keys parse free.
- Dashboard checkout: `apps/app` Billing page → `POST /api/billing/init` → worker `/v1/admin/billing/subscribe`; `authorization_url` redirect checkout. Subscription status read from the worker (worker is the source of truth; the Paystack secret stays worker-side).
- Worker error reporting via Sentry (`observability.py`), off unless `SENTRY_DSN` is set. Hardened for the privacy invariant (Directive 1): `include_local_variables=False` so PDF bytes in stack-frame locals never ship, `max_request_body_size="never"` so the upload body is never captured, `send_default_pii=False` (no cookies/auth header/IP), `traces_sample_rate=0`, plus a `scrub_event` before-send that strips request data/headers/cookies/query. Settings are pinned by a regression test that fails if any is loosened.
- Worker schema is now owned by Alembic migrations (`db.py` `run_migrations`, no ORM; `0001_baseline`), with a self-heal that stamps a pre-Alembic DB at the baseline.
- Overage auto-invoicing: an in-process daily scheduler (`billing_cron.py`, zero new deps) bills each closed cycle's overage and runs a boot catch-up. Idempotent per `(owner, cycle)` via the `overage_invoices` ledger, so daily cadence and worker restarts never double-bill. The cap + overage rate are frozen per cycle in `cycle_tiers` while the cycle is live (migration `0002_overage_billing`), so a closed-cycle invoice is computed from the economics that applied then, never re-priced if `TIERS` changes later. No-op when Paystack is unconfigured (no fake charges). Reads audit success counts only, no PDF payload (Directive 1). Replaces the manual-only `/v1/admin/billing/charge-overage` path (which stays for ad-hoc use). The metering window is the UTC calendar month (deliberate, not the Paystack subscription anchor): the cap resets on the 1st for everyone and the overage invoice does not align with the base-fee renewal date. `/v1/usage` and the cron share that single window definition (`audit.py`) so the customer never sees a figure that disagrees with the invoice. Revisit to subscription-anchored cycles post-revenue.

### Changed (structure)

- `apps/worker/main.py` split into an orchestrator + `routes/` (health, account, keys, billing, parse) + `state.py` (AppState + auth deps) + `responses.py` (shared error envelope). The `_state(request)` helper became a `get_state` dependency.
- `packages/types` now mirrors the full worker `/v1` contract (key, subscription, overage-usage types), consumed by `apps/app`.

### Pending (tracked follow-ups)

- None open.
