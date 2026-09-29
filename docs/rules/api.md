# API

B2B consumers are first-class. Versioned URLs from day one (`/v1/...`). Breaking changes go to `/v2/`. Never a bare `/parse`.

## POST /v1/parse

```
Authorization: Bearer bsk_live_xxx
Content-Type: multipart/form-data
body: pdf=<file>
optional: bank=<name>   skip auto-detect
          redact=true   return the redacted PDF/XLSX bytes
query:    format=json (default) | csv

200 → ParseResponse JSON (see worker rule), CSV, or redacted bytes
401 → invalid / missing key
402 → subscription inactive (error_class: subscription_inactive)
413 → over 50 MB
422 → unsupported bank, layout drift, encrypted, empty, or reconciliation failure
500 → internal error (format_version when known)
```

Non-2xx bodies use one envelope: `{ error, error_class, format_version, marker_coverage }` (`models.ErrorResponse`).

Async variant: `POST /v1/parse/jobs` → 202 `{ job_id, stream_url, poll_url }`, same gates. See [worker](worker.md).

## Free-tier cap: no 429

Over a free cap the response is a 200 canned synthetic sample (`sample.py`). The engine does not run. It carries an additive `_sample` marker and an `X-Bankstract-Sample: true` header. 429 is unused product-wide.

- Demo (anonymous): `demo_rate_limit_max` per IP per window (config.py).
- Test keys: `test_tier_monthly_cap` successful parses per owner per month (config.py).
- Failed parses never count.

The demo calls the same `/v1/parse` with a demo key plus a Turnstile token. One worker code path, two surfaces.

## API keys

- Format `bsk_<env>_<random32>`. `<env>` (`live` | `test`) is derived from the tier at mint time and exists only in the key string. `tier` is the single classification (DB + wire): `live` | `test` | `first_party`. Rationale in `auth.py`.
- `live`: parses under an active Paystack subscription, else 402. Many per owner, via `POST /v1/keys` (`test` is unrepresentable there → 422).
- `test`: free up to the cap, then the sample. One active per owner, auto-provisioned at signup, rotated via `POST /v1/keys/test` (revoke old, issue new). For onboarding, not free production.
- `first_party` (admin-only mint): surfaces we run ourselves. Key string reads `bsk_live_*`; the DB tier is the truth. No subscription gate, no test cap. Capped per end-user IP from the `X-First-Party-Client-IP` header, trusted for this tier only. Rotation is revoke + remint.
- Stored hashed (argon2). The raw key is shown once. Revocation sets `revoked_at`; never delete (audit trail).

## Wire types

`packages/types/src/parse.ts` mirrors `models.py`, and the SDK (`packages/sdk`) re-exports it. A wire change updates both, plus `apps/docs` (quickstart, formats, errors) and the regenerated `apps/docs/openapi.json` (`uv run python scripts/export_openapi.py`; CI diffs it).
