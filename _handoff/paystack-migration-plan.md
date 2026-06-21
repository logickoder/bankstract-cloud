# Plan — Paystack billing migration (worker + app)

Status: DRAFT for owner approval. No code until approved.

## Problem

Worker `billing.py` still runs Stripe per-parse USD metering (`_PRICE_PER_PARSE_USD = "0.10"`,
`stripe.billing.MeterEvent`). Charter (CLAUDE.md §5) + PRD § Pricing require Paystack NGN monthly
subscriptions with per-tier caps, overage billed via Paystack Invoices, and key lifecycle bound to
subscription state (`402 subscription_inactive`). No webhook endpoint exists. Commit `a255149`
migrated docs only; the code contradiction stands.

## Pricing (PRD, canonical)

| Tier | NGN/mo | Cap (parses/mo) | Overage |
|------|--------|-----------------|---------|
| Starter | 9,500 | 1,000 | ₦15/parse |
| Growth | 35,000 | 10,000 | ₦12/parse |
| Scale | 150,000 | 100,000 | ₦8/parse |
| Enterprise | custom | unlimited | negotiated |

Free demo: 50/mo per IP, hard-stop, watermarked. Self-host: unlimited. Annual prepay 15% off.
Failed parses never counted, never billed. Overage requires an active sub (no PAYG).

## Architecture decisions

1. **Worker is the enforcement point.** B2B customers POST `/v1/parse` with `bsk_live_` keys
   directly, NOT through the app proxy. So the worker's auth path must know the owner's
   subscription status to return 402. Enforcement cannot live in the app.

2. **Paystack secret key lives only in the worker.** App billing routes proxy to worker
   admin endpoints (app already holds `ADMIN_API_TOKEN`). App never sees the Paystack secret
   (Directive 2 — one secret, one place). Worker creates the Paystack customer + subscription;
   owner↔customer mapping is owned from creation, so webhooks resolve cleanly.

3. **Worker is the single source of truth for subscription state.** New worker `subscriptions`
   table. The app's Better Auth user fields (`subscriptionStatus` etc.) become a display cache
   refreshed from the worker on dashboard load, not the authority.

4. **Webhook receiver = worker** (`POST /v1/billing/webhook`, public, HMAC-SHA512 verified,
   deduped by event id). Single Paystack webhook URL.

## Flow

```
Subscribe:
  app Billing page --POST /api/billing/init {tier}-->
  app route (session owner) --POST /v1/admin/billing/subscribe {owner,tier}-->
  worker: ensure Paystack customer (store customer_code<->owner), init subscription txn for tier plan
       <--{authorization_url, access_code, reference}--
  client runs Paystack inline checkout, pays

Activate (async):
  Paystack --charge.success / subscription.create--> worker /v1/billing/webhook
  worker: verify HMAC-SHA512, dedup by event id, resolve customer_code->owner, upsert subscription
          (status=active, tier, current_period_end)
  -> bsk_live_ for that owner now parses

Enforce (every parse with a live key):
  worker authenticate() -> AuthContext{owner, tier}
  if tier == live and not subscription_active(owner): 402 subscription_inactive
  test keys parse free; anonymous unchanged (Turnstile + IP rate limit)

Deactivate:
  subscription.disable / subscription.not_renew / invoice.payment_failed -> webhook
  worker flips status -> live keys 402
```

## Worker changes

- **config.py**: drop `stripe_secret_key`, `stripe_meter_event_name`. Add `paystack_secret_key=""`,
  per-tier plan codes (`paystack_plan_starter/growth/scale`, Paystack `PLN_` codes via env).
  Empty secret => billing disabled, dev no-op (Directive 6, no fake charges).
- **billing.py rewrite**: `PaystackClient` — `ensure_customer(owner,email)`, `init_subscription(customer,plan)`,
  `create_invoice(customer, amount_kobo, desc)` (overage), `verify_webhook(body, signature)` (HMAC-SHA512).
  Remove Stripe SDK, MeterEvent, USD price.
- **subscriptions.py (new)**: SQLite `subscriptions(owner PK, customer_code, subscription_code,
  plan_code, tier, status, current_period_end, updated_at)` + `webhook_events(event_id PK, received_at)`
  for dedup. Methods: `register_customer`, `upsert_from_webhook`, `status_for_owner(owner)`.
- **auth.py**: `AuthContext` gains `owner`; `authenticate()` selects owner. (Status check lives in
  the parse path, not in authenticate, to keep auth pure.)
- **usage.py (new)**: overage = max(0, period_success_count - tier_cap); invoice amount = overage *
  tier_rate. Reuses existing audit success counts (metadata-only, no new payload). Invoice creation
  fn; the end-of-cycle TRIGGER (cron) is an ops follow-up (see Q2).
- **main.py**: `POST /v1/billing/webhook` (public, raw body, HMAC verify, dedup, dispatch);
  `POST /v1/admin/billing/subscribe`; `GET /v1/admin/billing/status?owner=`; parse() live-key gate -> 402.
- **db.py / schema**: add the two tables to `init_schema`.
- **models.py**: `SubscriptionStatus`, `SubscribeRequest/Response`; add 402 to parse responses.

## App changes

- **Billing page**: replace the "notify me" placeholder with tier cards + Subscribe buttons +
  current status (from worker). Naira in JetBrains Mono (voice rule).
- **`POST /api/billing/init`**: session -> proxy `/v1/admin/billing/subscribe`. Returns checkout
  params; client runs Paystack inline.
- **`GET /api/billing/status`**: proxy `/v1/admin/billing/status?owner=` for the page.
- Better Auth user subscription fields become a refreshed-on-load cache (worker is truth).

## Secrets / env (Directive 2)

- `PAYSTACK_SECRET_KEY` (worker only). Pre-commit scan already covers it + `sk_live_`/`pk_live_`.
- Per-tier `PAYSTACK_PLAN_*` codes (worker env). Owner provisions plans in Paystack dashboard (Q1).
- Remove `STRIPE_*` from config + `.env.example`; drop `STRIPE_SECRET_KEY=` from the pre-commit
  scan and update CLAUDE.md §2 note (this migration is the trigger the charter named).

## Directive / privacy check

- Directive 1: billing is parse-count metadata only; subscription table holds no PDF data.
- Audit log stays metadata-only; overage metering reads existing success counts.
- Failed parses never billed: metering counts audit success=true only (existing semantics).

## Slices (sequenced PRs)

1. Worker billing core: config, PaystackClient, subscriptions store + schema, webhook endpoint,
   admin subscribe/status. Tests: synthetic webhook payloads + HMAC verify. NON-breaking (no gate).
2. Enforcement: AuthContext.owner + parse live-key 402 gate. Tests.
3. Overage metering (usage.py): cap math + invoice fn. Trigger deferred (Q2).
4. App checkout UI: Billing page + init/status proxies + inline checkout.
5. Cleanup: remove Stripe scaffolding + STRIPE_* + scan entry; update CLAUDE.md/CHANGELOG.

## Decisions (locked 2026-06-21)

- D1 State authority: **worker is truth**. App reads status from worker each load; Better Auth
  user fields are a display cache.
- D2 Overage: **compute + expose, defer auto-invoice**. Slice 3 meters overage and wires the
  Paystack Invoice creation fn, triggered manually until a cron lands (follow-up).
- D3 `invoice.payment_failed`: **inactive immediately** (no grace). Live keys 402 on next call.
- D4 Plan codes: **env placeholders now** (`PAYSTACK_PLAN_*`). Owner provisions the 3 Paystack
  plans + fills real `PLN_` codes before deploy.
