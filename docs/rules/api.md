# API

B2B consumers are first-class. Versioned URLs from day one (`/v1/...`). Breaking changes go to `/v2/`. Never a bare `/parse`.

## POST /v1/parse

```
Authorization: Bearer bsk_live_xxx
Content-Type: multipart/form-data
body: pdf=<file>
optional: bank=<name>   skip auto-detect
query:    format=json (default) | csv

200 → ParseResponse JSON (see worker rule) or CSV
401 → invalid / missing key
402 → subscription inactive (error_class: subscription_inactive)
413 → over 50 MB
422 → unsupported bank, layout drift, encrypted, empty, or reconciliation failure
500 → internal error (format_version when known)
```

Non-2xx bodies use one envelope: `{ error, error_class, format_version, marker_coverage }` (`models.ErrorResponse`).

Async variant: `POST /v1/parse/jobs` → 202 `{ job_id, stream_url, poll_url }`, same gates. See [worker](worker.md).

## POST /v1/redact

Same body, auth, gates and error envelope as `/v1/parse`. 200 → the redacted PDF/XLSX bytes with `X-Bankstract-Redactions` and `X-Bankstract-Format-Version`. It counts as one parse. There is no canned sample for a redacted document, so over a free cap it returns 402 `free_limit_reached` (`free_cap_refusal`). Its own route since the alpha break: one route, one response shape, so OpenAPI is accurate. There is no async redact: a request holds one of the `parse_max_concurrent` engine slots for the length of the redaction, up to `isolate_timeout_seconds`, like sync parse and inspect. The old `redact=true` field on `/v1/parse` and `/v1/parse/jobs` fails closed: it returns 422 `removed_parameter` before admission and the engine run, because ignoring it would hand back the unmasked statement with a 200.

## POST /v1/inspect

```
Authorization: Bearer bsk_live_xxx
Content-Type: multipart/form-data
body: pdf=<file>   optional: bank=<name>

200 → IntegrityReport JSON ({ bank, format_version, signals[], clean })
401 → invalid / missing key
402 → subscription inactive, or a free cap reached (free_limit_reached)
403 → (none from inspect itself; 403 stays for admin routes)
413 → over 50 MB
422 → encrypted, unsupported, or ResourceLimitError (a file stopped at the processing limits)
500 → internal error
```

Evidence, never a verdict. HTTP 200 with error signals is a normal outcome. One inspect counts as one parse for caps and overage (every count query sums `success` rows with no endpoint filter; `audit_log.endpoint` only keeps the two distinguishable). A file the engine could not parse comes back as a 200 report with an `unparseable` error signal and is audited as a failure, so it never counts. Over a free cap it returns 402 and never a canned sample, because a made-up clean report would read as a real pass. `IntegritySignal.detail` quotes the statement: return it to the caller, never log or audit it. The audit row is metadata only, never signal codes.

## Free-tier cap: no 429

Over a free cap the response is a 200 canned synthetic sample (`sample.py`). The engine does not run. It carries an additive `_sample` marker and an `X-Bankstract-Sample: true` header. 429 is unused product-wide.

- Demo (anonymous): `demo_rate_limit_max` per IP per window (config.py).
- Test keys: `test_tier_monthly_cap` successful parses per owner per month (config.py).
- Failed parses never count.

The demo calls the same `/v1/parse` with a demo key plus a Turnstile token. One worker code path, two surfaces.

The demo key can call every upload route (parse, redact, inspect) with a Turnstile token, and they all draw on the one per-IP budget (admission counts every admitted request, even one that later fails). Redact and inspect have no canned sample, so over the cap they return 402 `free_limit_reached`. Demo parse and inspect JSON carry the additive `_demo` envelope; a redacted document is binary and cannot be watermarked.

## API keys

- Format `bsk_<env>_<random32>`. `<env>` (`live` | `test`) is derived from the tier at mint time and exists only in the key string. `tier` is the single classification (DB + wire): `live` | `test` | `first_party`. Rationale in `auth.py`.
- `live`: parses under an active Paystack subscription, else 402. Many per owner, via `POST /v1/keys` (`test` is unrepresentable there → 422).
- `test`: free up to the cap, then the sample. One active per owner, auto-provisioned at signup, rotated via `POST /v1/keys/test` (revoke old, issue new). For onboarding, not free production.
- `first_party` (admin-only mint): surfaces we run ourselves. Key string reads `bsk_live_*`; the DB tier is the truth. No subscription gate, no test cap. Capped per end-user IP from the `X-First-Party-Client-IP` header, trusted for this tier only. Rotation is revoke + remint.
- Stored hashed (argon2). The raw key is shown once. Revocation sets `revoked_at`; never delete (audit trail).

## Wire types

`packages/types/src/parse.ts` mirrors `models.py`, and the SDK (`packages/sdk`) re-exports it. A wire change updates both, plus `apps/docs` (quickstart, formats, errors) and the regenerated `apps/docs/openapi.json` (`uv run python scripts/export_openapi.py`; CI diffs it).
