# Secrets

This repo is public. A secret in source is a breach.

- `.env.production` is gitignored at the root and in every app. `.env.example` documents every variable with placeholders.
- Environment only: the Paystack secret key, the Better Auth secret and OAuth client secrets, the Sentry DSN, DB connection strings.
- The pre-commit hook blocks `sk_live_`, `pk_live_`, and `PAYSTACK_SECRET_KEY=`. Those are Paystack live keys. `sk_test_` / `pk_test_` are fine in dev.
- Paystack signs webhooks with the secret key (HMAC-SHA512). There is no separate webhook secret.
- Keys you generate for dev work use a `test_` / `bsk_test_` prefix. Never `live_`.
- Never print a secret's value in a tool call or log. Read `.env` by variable name only.
