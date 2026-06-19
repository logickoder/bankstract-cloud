# bankstract-cloud — Claude Operating Charter

You are working inside `bankstract-cloud`, a public AGPL-3.0 SaaS layer on top of the `bankstract` OSS engine. Primary product: B2B statement parsing API for Nigerian fintechs / bookkeeping SaaS / tax-prep startups. Secondary surface: free browser drag-drop demo.

Owner: Jeffery Orazulike (github.com/logickoder).

Sibling repo: github.com/logickoder/bankstract (the OSS Python engine, MIT). This repo CONSUMES the engine via `pip install bankstract`. Never vendor / fork the engine source.

---

## CORE DIRECTIVES

### 1. PRIVACY IS THE PRODUCT — NEVER STORE PDF CONTENT

The single load-bearing trust claim is "we process in memory, we never write your PDF to disk, we never log file contents." If you violate this, the product brand dies.

Concrete rules:

- PDF bytes flow: client → FastAPI worker → `BytesIO` → `bankstract.parse(stream)` → `ParseResult` → JSON response → garbage collected
- NEVER write PDF bytes to disk (`open(..., 'wb')`, `Path.write_bytes`, `tempfile.NamedTemporaryFile` with delete=False, etc)
- NEVER log PDF contents, transaction details, account holders, or balances — only filename, byte count, parser detected, success/fail timestamp
- NEVER persist `ParseResult.transactions` or `metadata` to a database — return them in the HTTP response and let them die
- Audit log schema is metadata-only: `(id, timestamp, api_key_id_or_anonymous, filename, byte_count, parser_detected, success: bool, error_class: str | None)`. No payload fields.
- If a feature request asks for "transaction history" or "saved parses", push back. That's a v1.5+ opt-in feature, NOT a default.

### 2. SECRETS NEVER COMMIT

This repo is public. Secrets in source = breach.

- `.env.production` gitignored from root + every app
- `.env.example` checked in with placeholder values + comments
- Stripe webhook signing secret, Clerk private key, Sentry DSN, DB connection string → environment variables only
- Pre-commit hook scans for `sk_live_`, `whsec_`, `pk_live_`, `STRIPE_SECRET_KEY=` patterns; halt commit if matched
- If you generate a secret as part of dev work (test API key, etc), use the `test_` / `bsk_test_` prefix; never `live_`

### 3. LICENSE IS AGPL-3.0 — RESPECT THE COPYLEFT

- All source files in `apps/` and `packages/` carry the AGPL-3.0 header (see `LICENSE_HEADER.txt`)
- The engine (`bankstract`, MIT) is a runtime dependency — does NOT inherit AGPL
- B2B API consumers call us via HTTP — they do NOT inherit AGPL (clarify this in docs whenever it surfaces)
- A SaaS-hosted fork must open-source modifications. This is the moat. Do not weaken it.

### 4. HUMAN IN THE LOOP

Do not run `git commit`, `git push`, `git tag`, `gh pr create`, `gh release create`, `pnpm publish`, `docker push`, or any deploy / state-publishing operation without explicit owner command in the current turn. Edit, save, halt.

### 5. SURGICAL EDITS

Touch the specific app / package under request. Don't refactor across `apps/marketing`, `apps/app`, `apps/worker` in one pass unless explicitly tasked. Each app is independently deployable — touching one to "fix" another is forbidden.

### 6. ZERO HALLUCINATION ON BUSINESS LOGIC

Billing logic, rate limit math, API key issuance, parser orchestration — read the actual code, confirm the actual schema, run the actual endpoint. Never write "I think the rate limit is 10/hour" — grep for it, point at the constant.

### 7. NO BOILERPLATE COMMENTS

Same as bankstract — comments earn their place when removing them would confuse a future reader. No "// validate input" above `validate()`, no JSDoc on obvious functions.

Earned comment example:
```ts
// Cloudflare Turnstile sends the token via formData NOT JSON body.
// Don't fetch req.json() — the multipart parser eats the PDF.
const formData = await req.formData()
```

### 8. TONE

Direct, technical, honest. Report the change, the file, the line. No "I've gone ahead and...", no "Let me know if...".

### 9. STRICT TYPE-CHECKING IS GREEN OR BUST

- TypeScript: `strict: true` + `noUncheckedIndexedAccess: true`. Zero `any` (use `unknown` + narrow). Zero `@ts-ignore` (use `@ts-expect-error` with explanation).
- Python: `pyright` strict mode in `apps/worker`. Zero errors, zero warnings.
- ESLint: `eslint-plugin-import` strict, `no-unused-vars` errors not warns.
- Ruff: same config as bankstract engine.

---

## REPO LAYOUT

```
bankstract-cloud/
├── LICENSE                       AGPL-3.0
├── LICENSE_HEADER.txt            short AGPL notice for source files
├── SECURITY.md                   disclosure policy
├── CONTRIBUTING.md               PR + commit conventions
├── CODE_OF_CONDUCT.md            standard
├── PRD.md                        product spec (public)
├── AGENTS.md                     AI agent quick-ref (mirrors CLAUDE.md essentials, tool-agnostic)
├── CLAUDE.md                     this file (Claude Code charter)
├── README.md                     human entry point
├── package.json                  root package, pnpm workspace + Turbo scripts
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example                  documented env vars
├── .gitignore                    .env.production, .env.local, _local/, etc
├── apps/
│   ├── marketing/                Next.js 15 — landing, pricing, OSS callout
│   ├── app/                      Next.js 15 — developer dashboard (Clerk auth, API keys, usage, billing)
│   ├── docs/                     Mintlify or Fumadocs — OpenAPI spec + integration guides
│   ├── demo/                     Next.js 15 — consumer drag-drop showcase (anonymous + Turnstile)
│   └── worker/                   FastAPI (Python) — wraps bankstract engine, parse endpoint, B2B auth
├── packages/
│   ├── ui/                       shadcn components shared across Next.js apps
│   ├── types/                    TS types (ParseResult, StatementMetadata mirror of engine schema)
│   ├── tsconfig/                 shared tsconfig presets
│   └── eslint-config/            shared ESLint config
└── infra/
    ├── docker-compose.yml        self-host bundle — verifiable AGPL self-host claim
    ├── Caddyfile                 reverse proxy (Hetzner + Coolify default)
    └── README.md                 self-host setup walkthrough
```

App separation logic:
- `marketing/` vs `app/` separate because: different audience (visitor vs auth'd dev), different deploy cadence, different SEO posture
- `docs/` separate because: ships an OpenAPI spec + interactive playground; tooling (Mintlify/Fumadocs) is opinionated
- `demo/` vs `app/` separate because: demo = anonymous + Turnstile + no auth; app = Clerk-auth'd + key management. Different rate-limit + state stories
- `worker/` separate because: Python (not TS); deployed as a container alongside Coolify-managed Next.js services

---

## STACK + CONVENTIONS

### Frontend (apps/marketing, apps/app, apps/docs, apps/demo)
- Next.js 15 (App Router)
- React 19
- TypeScript strict
- Tailwind v4
- shadcn/ui + Magic UI components
- Clerk for auth (apps/app only; demo is anonymous)
- Stripe for billing (apps/app only)
- Cloudflare Turnstile (apps/demo + apps/marketing forms)

### Worker (apps/worker)
- Python 3.11+
- FastAPI + uvicorn
- `bankstract` PyPI library (engine, MIT) — install via `uv add bankstract`
- `pyright` strict
- `ruff` lint + format
- `pytest` for tests
- `uv` for env + deps

### Monorepo tooling
- `pnpm` workspaces
- `turbo` for task orchestration (build, lint, test, dev across apps)

### Brand language
See [`DESIGN.md`](./DESIGN.md) — single source of truth for tokens, components, page structure, references, anti-patterns. Do not duplicate design rules here.

### Hosting
- All Next.js apps + FastAPI worker run on single Hetzner CAX11 (ARM, 2 vCPU, 4GB RAM) via Coolify
- Cloudflare in front (CDN, DDoS, SSL termination, Turnstile)
- SQLite on worker box for audit log + Clerk-backed dashboard for keys
- Backups: nightly to Cloudflare R2 (free tier — 10GB egress + storage)
- Domain: `bankstract.logickoder.dev` (subdomain on owner-controlled `logickoder.dev`, ₦0). Pivot to standalone TLD post-revenue.
- **Fixed cost: ~₦5–6k/mo (~$4–5/mo). Locked indie-cheap.**

---

## COMMANDS

```bash
# install all deps (TS + Python via uv in apps/worker)
pnpm install
cd apps/worker && uv sync --all-extras && cd ../..

# dev — runs all apps concurrently via Turbo
pnpm dev

# dev — single app
pnpm --filter marketing dev
pnpm --filter app dev
pnpm --filter docs dev
pnpm --filter demo dev
cd apps/worker && uv run uvicorn bankstract_cloud.main:app --reload

# lint + types (MUST pass clean per directive 9)
pnpm lint
pnpm typecheck
cd apps/worker && uv run ruff check . && uv run pyright .

# test
pnpm test                              # all TS tests
pnpm --filter app test                 # single app
cd apps/worker && uv run pytest

# build
pnpm build                             # all apps via Turbo

# self-host bundle (verifies AGPL self-host claim)
docker compose -f infra/docker-compose.yml up --build
```

---

## ARCHITECTURE INVARIANTS

### 1. Worker imports bankstract engine, NEVER subprocess-shells-out

```python
# CORRECT
import bankstract
result = bankstract.parse(stream)

# WRONG
subprocess.run(["bankstract", "auto", "-"], input=pdf_bytes, ...)
```

Subprocess-shell-out = slow (process spawn), fragile (CLI version drift), leaks temp files. Lib import = clean, semver-locked.

### 2. PDF bytes never leave memory

```python
# CORRECT
@app.post("/v1/parse")
async def parse(pdf: UploadFile, ...) -> ParseResponse:
    buf = io.BytesIO(await pdf.read())
    result = bankstract.parse(buf)
    # ParseResult + StatementMetadata are dataclasses; only Transaction is
    # pydantic. Wire format goes through our own pydantic response contract
    # in apps/worker/src/bankstract_cloud/models.py — decouples API surface
    # from engine internals so the engine can evolve without breaking /v1/*
    # clients. Never return result directly.
    return ParseResponse.from_engine(result)

# WRONG — writes to disk
@app.post("/v1/parse")
async def parse(pdf: UploadFile, ...):
    with open("/tmp/in.pdf", "wb") as f:
        f.write(await pdf.read())
    result = bankstract.parse(Path("/tmp/in.pdf"))
    ...

# WRONG — leaks engine internals to wire format
@app.post("/v1/parse")
async def parse(pdf: UploadFile, ...):
    result = bankstract.parse(buf)
    return result.model_dump(mode="json")  # AttributeError — ParseResult is a dataclass
```

### 3. B2B API consumers are first-class

Endpoint shape:
```
POST /v1/parse
  Authorization: Bearer bsk_live_xxx
  Content-Type: multipart/form-data
  body: pdf=<file>
  optional:
    bank=<name>      skip auto-detect
    redact=true      run redactor — returns redacted bytes (PDF or XLSX) directly w/ proper Content-Type

Response:
  200 → ParseResponse JSON (wire contract — apps/worker/src/.../models.py)
  401 → invalid / missing API key
  402 → billing failure (Stripe declined)
  413 → file too large (>50MB)
  422 → no parser detected (unsupported bank or wrong format)
  429 → rate limit exceeded
  500 → internal parse error (include format_version)
```

Versioned URL prefix `/v1/` from day 1. Breaking changes → `/v2/`.

**Redaction is live as of engine 0.11.0.** `bankstract.redact(buf, bank=bank)` returns `RedactResult(data, bank, format, format_version, report)`. Worker pattern:

```python
@app.post("/v1/parse")
async def parse(pdf: UploadFile, redact: bool = False, bank: str | None = None) -> Response:
    buf = io.BytesIO(await pdf.read())
    if redact:
        result = bankstract.redact(buf, bank=bank)
        return Response(
            content=result.data,
            media_type=_media_type(result.format),  # application/pdf or vnd.openxmlformats-officedocument.spreadsheetml.sheet
            headers={
                "X-Bankstract-Redactions": str(result.report.redactions),
                "X-Bankstract-Format-Version": result.format_version,
            },
        )
    parse_result = bankstract.parse(buf, bank=bank)
    return ParseResponse.from_engine(parse_result)
```

**Privacy invariant still holds:** `bankstract.redact()` returns bytes in-memory, no tempfile (verified by engine's tempfile-invariant test via TMPDIR monkeypatch). Worker streams `result.data` straight to HTTP response. Engine pin must be `bankstract>=0.11.0`.

### 4. Consumer demo calls the same endpoint internally

`apps/demo` POSTs to the same `/v1/parse` worker endpoint using a public demo key + Turnstile token. Server validates Turnstile + applies anonymous rate limit. One worker code path, two surfaces.

### 5. Stripe usage billing per parse

Each successful parse from a paid API key → Stripe metered billing record `meter=parses_v1, quantity=1, api_key_id=<id>`. Failed parses (parser errors) → not billed.

---

## TESTING

- Each app has unit tests in `apps/<app>/__tests__/` or `apps/<app>/src/**/*.test.ts`
- Worker has pytest tests under `apps/worker/tests/`
- Integration tests for the `/v1/parse` endpoint use synthetic PDFs (NOT real bank statements) — see `apps/worker/tests/fixtures/`
- E2E (Playwright) for marketing + demo critical flows: hero render, demo upload, signup
- CI runs lint + typecheck + test on every PR; deploy only from `main` after manual review

Fixture privacy rule (mirrors bankstract engine):
- No real bank PDFs in this repo, ever. Worker tests use synthetic PDFs OR call into engine's own committed redacted fixtures via local mount in dev.
- No real names, account numbers, BVN, addresses inline in source. Use `FOO`, `BAR`, `ACME`, `1111 2222`, etc.

---

## API KEY CONVENTIONS

- Format: `bsk_<env>_<random32>` where `<env>` is `live` or `test`
- `bsk_live_` keys hit production billing
- `bsk_test_` keys parse for free, used in onboarding + integration testing
- Keys stored hashed (argon2) in DB; raw key shown ONCE on creation
- Revocation = mark `revoked_at` timestamp; never delete (audit trail)

---

## VOICE (marketing, docs, microcopy)

- B2B-first dev brand. Audience: developers + PMs at Nigerian fintechs / bookkeeping SaaS / tax-prep startups.
- No emojis in body copy.
- No marketing language ("seamless", "powerful", "robust", "blazingly fast", "AI-powered").
- Declarative sentences. State what it does, then how.
- "We" only when referring to the team; never "us / our customers" upsell-speak.
- Naira amounts ALWAYS in JetBrains Mono. Visual rule.
- Bank names in plain text, no logos in body copy (logos go in coverage grid only).
- Owner brand identifier is `logickoder` — always link to `github.com/logickoder` in public-facing copy.

---

## OUT OF SCOPE — DO NOT ADD

- Category inference (rule-based or ML) — downstream concern
- Mobile native client — not v1
- Multi-tenant org accounts — not v1
- Whitelabel for accounting firms — not v1
- Direct bank API integrations (Mono / Okra wrappers) — different product
- Pyodide / WASM in-browser parsing — v2 if usage justifies
- Categorization, budgeting, dashboards on top of parsed data — downstream concern
- Direct push to BudgetBakers / YNAB / Notion / Google Sheets — Cloud returns JSON; integrations belong in customer code
- Statement-download automation (logging into bank portals) — separate tool, never ship here

If asked to add any of the above, push back. State the directive. Refer to PRD.md § Out of scope.

---

## ASSISTANT RESPONSE FORMAT

- State change → terse confirmation with file + function name
- Diagnosis → root cause in one to two sentences, then the fix
- Refusal → cite the directive being upheld (e.g. "Directive 1 — PDF bytes in memory only. Cannot use `tempfile.NamedTemporaryFile`. Use `BytesIO`.")
- Never apologize. Acknowledge errors technically and move on.
