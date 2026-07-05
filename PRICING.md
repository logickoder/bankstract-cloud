# Pricing: Paystack plan setup

Single source of truth for bankstract subscription tiers. Create these 6 plans in the Paystack
dashboard (Products -> Subscriptions -> Plans -> New Plan), then paste the resulting `PLN_` codes
into the production `.env`.

---

## Plans to create

Paystack amounts are in **NGN** (whole naira, not kobo) when entered via the dashboard form.
The API/SDK uses kobo; the kobo column is for reference when using the Paystack API directly.

### Starter

| Field | Monthly | Annual |
|---|---|---|
| Plan name | `bankstract Starter Monthly` | `bankstract Starter Annual` |
| Description | `1,000 parses/mo. Overage: ₦15/parse, billed at cycle end.` | `1,000 parses/mo. 15% off vs monthly. Overage: ₦15/parse.` |
| Plan amount (NGN) | `9500` | `96900` |
| Plan amount (kobo) | `950000` | `9690000` |
| Interval | Monthly | Annually |
| Max. number of payments | (leave blank) | (leave blank) |
| Env var | `PAYSTACK_PLAN_STARTER` | `PAYSTACK_PLAN_STARTER_ANNUAL` |

### Growth

| Field | Monthly | Annual |
|---|---|---|
| Plan name | `bankstract Growth Monthly` | `bankstract Growth Annual` |
| Description | `10,000 parses/mo. Overage: ₦12/parse, billed at cycle end.` | `10,000 parses/mo. 15% off vs monthly. Overage: ₦12/parse.` |
| Plan amount (NGN) | `35000` | `357000` |
| Plan amount (kobo) | `3500000` | `35700000` |
| Interval | Monthly | Annually |
| Max. number of payments | (leave blank) | (leave blank) |
| Env var | `PAYSTACK_PLAN_GROWTH` | `PAYSTACK_PLAN_GROWTH_ANNUAL` |

### Scale

| Field | Monthly | Annual |
|---|---|---|
| Plan name | `bankstract Scale Monthly` | `bankstract Scale Annual` |
| Description | `100,000 parses/mo. Overage: ₦8/parse, billed at cycle end.` | `100,000 parses/mo. 15% off vs monthly. Overage: ₦8/parse.` |
| Plan amount (NGN) | `150000` | `1530000` |
| Plan amount (kobo) | `15000000` | `153000000` |
| Interval | Monthly | Annually |
| Max. number of payments | (leave blank) | (leave blank) |
| Env var | `PAYSTACK_PLAN_SCALE` | `PAYSTACK_PLAN_SCALE_ANNUAL` |

---

## Overage rates (already hardcoded in config.py)

| Tier | Rate |
|---|---|
| Starter | ₦15/parse |
| Growth | ₦12/parse |
| Scale | ₦8/parse |

Overage is metered per UTC calendar month and invoiced via Paystack at cycle end
(`billing_cron.py`). Failed parses never count.

---

## After creating plans: fill infra-prod/.env

```
PAYSTACK_SECRET_KEY=sk_live_xxx

PAYSTACK_PLAN_STARTER=PLN_xxx
PAYSTACK_PLAN_GROWTH=PLN_xxx
PAYSTACK_PLAN_SCALE=PLN_xxx
PAYSTACK_PLAN_STARTER_ANNUAL=PLN_xxx
PAYSTACK_PLAN_GROWTH_ANNUAL=PLN_xxx
PAYSTACK_PLAN_SCALE_ANNUAL=PLN_xxx
```

Leave any annual plan blank to disable that interval for that tier (returns 503 on checkout).

---

## Full tier summary

| Tier | Monthly | Annual | Cap | Overage |
|---|---|---|---|---|
| Starter | ₦9,500 | ₦96,900 | 1,000 parses/mo | ₦15/parse |
| Growth | ₦35,000 | ₦357,000 | 10,000 parses/mo | ₦12/parse |
| Scale | ₦150,000 | ₦1,530,000 | 100,000 parses/mo | ₦8/parse |
| Enterprise | Custom | Custom | Unlimited | Negotiated |

Annual = monthly × 12 × 0.85 (15% off). No partial-month refunds.
