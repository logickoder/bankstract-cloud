# Billing

Monthly subscription tiers in NGN via Paystack (PRD § Pricing). Not per-parse USD metering.

- Each tier has a monthly parse cap. Parses beyond it meter as overage, per tier in `tiers.py`, and bill through Paystack Invoices at cycle end.
- Failed parses are never counted and never billed.
- An active subscription lets a live key parse. Inactive or suspended returns `402` with `error_class: subscription_inactive` (gate in `routes/parse.py`).
- Webhooks (`charge.success`, `subscription.create`, `subscription.disable`, `subscription.not_renew`, `invoice.payment_failed`) are verified with HMAC-SHA512 against the Paystack secret key and deduped by event reference.
- The worker is the source of truth: `paystack.py` (client + webhook verify), `subscriptions.py` (owner-keyed state + dispatch), `usage.py` (overage), `routes/billing.py`. `apps/web` proxies billing through the worker and never holds the Paystack secret.
- Rate-limit and billing math: read the constant, never quote it from memory. See [workflow](workflow.md).
