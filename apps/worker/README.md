# apps/worker

FastAPI worker. Wraps the [`bankstract`](https://github.com/logickoder/bankstract) engine and exposes the `/v1/*` API.

PDF bytes are parsed in memory (`BytesIO`) and never written to disk. The audit log is metadata only.

## Run

```bash
uv sync --all-extras
cp ../../.env.example .env        # fill DEMO_API_KEY etc; keep test_ prefixes in dev
uv run uvicorn bankstract_cloud.main:app --reload
```

## Checks

```bash
uv run ruff check .
uv run ruff format --check .
uv run pyright .
uv run pytest
```

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/v1/parse` | Bearer | multipart `pdf`; optional `bank`. `?format=json` (default) returns ParseResponse JSON; `?format=csv` returns engine-serialized CSV (`text/csv` + `Content-Disposition`). `redact=true` returns the redacted document bytes (PDF or XLSX) with the matching `Content-Type`. |
| POST | `/v1/parse/jobs` | Bearer | async job for long statements; same body + `format`/`redact` options as `/v1/parse`. `202` with `job_id` + `stream_url` + `poll_url`. |
| GET | `/v1/parse/jobs/{id}/stream` | job_id (no header) | SSE: `{stage,current,total}` progress, then a `result` event (the ParseResponse for json) |
| GET | `/v1/parse/jobs/{id}` | Bearer | JSON snapshot (poll fallback) |
| GET | `/v1/parse/jobs/{id}/result` | Bearer | the ParseResponse JSON, or the CSV / redacted bytes (csv/redact results are not inlined in the SSE event) |
| GET | `/v1/banks` | Bearer | engine-reported supported parsers |
| GET | `/v1/usage` | Bearer | current-month parses + projected invoice |
| GET | `/v1/status` | none | worker + engine version |
| GET | `/healthz` | none | liveness |
| GET | `/readyz` | none | engine + DB readiness |

### `redact=true`

`bankstract.redact()` returns bytes in-memory (engine guarantees no tempfile). The worker streams them straight to the response and sets:

- `Content-Type`: `application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `X-Bankstract-Redactions`: count of redactions applied
- `X-Bankstract-Format-Version`: engine format version

### `/v1/parse` status codes

`200` ParseResponse JSON, or redacted bytes when `redact=true` · `401` bad/missing key or failed Turnstile · `413` >50 MB · `422` unsupported bank / reconciliation failure · `429` rate limit · `500` engine error.

## API keys

Format `bsk_<env>_<random32>`. Stored argon2-hashed; the raw key is returned once on issue. The anonymous demo key comes from `DEMO_API_KEY` and is matched from config, never stored. Issue a key programmatically:

```python
from bankstract_cloud.auth import KeyStore
# issued = keystore.issue("my-key", "test")  # tier=test, not billed
```

## Layout

```
src/bankstract_cloud/
  main.py          FastAPI app + lifespan + wiring (orchestrator)
  routes/          per-domain endpoints (health, account, keys, billing, parse)
  state.py         AppState + auth dependencies (require_auth/require_admin)
  responses.py     shared ErrorResponse envelope + status->class map
  engine.py        bankstract wrapper, in-memory parse, error classification
  models.py        pydantic request/response contract (money as strings)
  auth.py          argon2 API key store + AuthContext
  audit.py         metadata-only audit log
  rate_limit.py    fixed-window per-IP limiter (anonymous demo)
  paystack.py      Paystack client (HMAC-SHA512 webhook verify, subscribe, invoice)
  subscriptions.py subscription state store + webhook dispatch
  usage.py         overage metering (per-owner, against tier cap)
  tiers.py         paid-tier caps + overage rates (PRD pricing)
  turnstile.py     Cloudflare Turnstile verification (anonymous tier)
  db.py            SQLite connection + Alembic migration runner
  migrations/      Alembic migrations (no ORM; hand-written)
  config.py        env-driven settings
tests/             pytest: synthetic PDFs only, no real statements
```
