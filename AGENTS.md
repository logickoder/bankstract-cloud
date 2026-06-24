# AGENTS.md: bankstract-cloud

Quick-reference for AI coding agents (Cursor, Claude Code, GPT, Codex, Cline, etc).
Authoritative deep-dive: `CLAUDE.md` (charter) and `PRD.md` (product spec).

## What this repo is

Public AGPL-3.0 SaaS layer on top of the `bankstract` MIT engine (sibling repo: `github.com/logickoder/bankstract`).

Primary product: B2B statement parsing API at `/v1/parse` for Nigerian fintechs / bookkeeping SaaS / tax-prep startups.
Secondary surface: free browser drag-drop demo at `bankstract.dev/demo`.

Owner: Jeffery Orazulike (github.com/logickoder).

## Repo shape

```
apps/
  web/          Next.js 16: ONE runtime - marketing /, demo /demo, dashboard /dashboard + /sign-in + /sign-up + /api/*
  marketing/    Next.js 16: thin extractable shell over packages/marketing
  demo/         Next.js 16: thin shell over packages/demo (the deployable demo in the infra/ self-host bundle)
  docs/         Fumadocs: API docs; deploys to Cloudflare Pages, surfaced at /docs (Caddy proxy + Next basePath /docs)
  worker/       FastAPI: imports `bankstract` engine, exposes /v1/parse (+ async /v1/parse/jobs)
packages/
  marketing/    marketing surface (home, sections, metadata) - consumed by apps/web + the thin shell
  demo/         demo surface (home, components, API handlers) - consumed by apps/web + the thin shell
  ui/           shadcn components shared across Next.js apps
  seo/          shared metadata + OG image + favicon helpers
  types/        shared TS types mirroring engine ParseResult
  tsconfig/     shared tsconfig presets
  eslint-config/ shared ESLint config (incl. the @stylistic quote/semi guard; no prettier)
infra/
  docker-compose.yml   public self-host bundle (worker + thin demo; verifies AGPL claim)
  Caddyfile            reverse proxy config
infra-prod/            owner's prod stack (worker + web behind an internal Caddy + a shared proxy)
```

## Hard rules (non-negotiable)

### 1. PDF bytes never touch disk
PDF flow: client → FastAPI worker → `BytesIO` → `bankstract.parse(stream)` → JSON response. No `Path.write_bytes`, no `NamedTemporaryFile(delete=False)`, no caching layers. PDF content never logged.

### 2. No secrets in source
Public repo. `.env.production` gitignored. `.env.example` documents env vars. Pre-commit scans for `sk_live_`, `pk_live_`, `PAYSTACK_SECRET_KEY=` and similar. Halt commit on match. `sk_live_`/`pk_live_` are Paystack live keys. Use `bsk_test_` for dev keys, never `bsk_live_`.

### 3. AGPL-3.0 headers on source files
All `.ts`, `.tsx`, `.py` files in `apps/` and `packages/` start with the short notice from `LICENSE_HEADER.txt`. Engine import (`bankstract`, MIT) is a runtime dependency, no header inheritance.

### 4. Worker imports the engine, never subprocess
```python
# CORRECT
import bankstract
result = bankstract.parse(stream)

# WRONG
subprocess.run(["bankstract", ...])
```

### 5. Audit log = metadata only
Schema: `(id, timestamp, api_key_id_or_anonymous, filename, byte_count, parser_detected, success, error_class)`. No payload fields. No transaction details. No account info.

### 6. Versioned API URLs
`/v1/parse`, `/v1/banks`, `/v1/usage` from day 1. Breaking changes → `/v2/`. Never bare `/parse`.

### 7. Human in the loop
No `git commit`, `git push`, `git tag`, `gh pr create`, `gh release`, `pnpm publish`, `docker push`, or deploy ops without explicit owner command in the current turn.

## Code style

### TypeScript
- `strict: true` + `noUncheckedIndexedAccess: true`
- Zero `any` (use `unknown` + narrow)
- Zero `@ts-ignore` (use `@ts-expect-error` with explanation)
- Zero unused vars (ESLint errors not warns)
- Prefer named exports over default exports
- React Server Components by default; mark `'use client'` only when needed

### Python (apps/worker)
- Python 3.11+
- `pyright` strict mode, zero errors / zero warnings
- `ruff` lint + format
- `pydantic` v2 for request/response models
- Type-hint all public functions; no untyped boundaries past the FastAPI handler

### Comments
- No `# parse the PDF` above `parse()`. No JSDoc on obvious functions.
- Comment earns its place when removing it would confuse a future reader:

```ts
// Cloudflare Turnstile sends the token via formData NOT JSON body.
// Don't fetch req.json(). The multipart parser eats the PDF.
const formData = await req.formData()
```

### Tone in commits + PRs + docs
- Direct, technical. No "I've gone ahead and...", no "Let me know if...".
- Conventional Commits (see CONTRIBUTING.md): `feat:`, `fix:`, `perf:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `style:`, `build:`, `revert:`.

## Commands

```bash
# install
pnpm install
cd apps/worker && uv sync --all-extras && cd ../..

# dev (all apps)
pnpm dev

# dev single app
pnpm --filter web dev     # the one runtime: marketing /, demo /demo, dashboard
pnpm --filter docs dev
cd apps/worker && uv run uvicorn bankstract_cloud.main:app --reload

# lint + types
pnpm lint
pnpm typecheck
cd apps/worker && uv run ruff check . && uv run pyright .

# test
pnpm test
cd apps/worker && uv run pytest

# build
pnpm build

# self-host bundle (verifies AGPL self-host claim)
docker compose -f infra/docker-compose.yml up --build
```

## Testing

- TS unit tests under `apps/<app>/__tests__/` or co-located `*.test.ts`
- Python tests under `apps/worker/tests/`
- E2E (Playwright) for marketing + demo critical flows: hero render, demo upload, signup
- Integration tests for `/v1/parse` use synthetic PDFs in `apps/worker/tests/fixtures/`
- **NO real bank PDFs ever in this repo.** Use synthetic generators or call into engine's own committed redacted fixtures via local mount in dev.
- Fixture content rule: no real names, account numbers, BVN, addresses inline. Use `FOO`, `BAR`, `ACME`, `1111 2222`.

## Out of scope (push back if asked)

- Category inference / ML transaction tagging
- Mobile native client (v1)
- Multi-tenant orgs (v1)
- Whitelabel for accounting firms
- Direct bank API integrations (Mono / Okra wrappers)
- Categorization, budgeting, dashboards on top of parsed data
- Push to BudgetBakers / YNAB / Notion / Google Sheets (customer code handles integrations)
- Statement-download automation (logging into bank portals)
- Pyodide / WASM in-browser parsing (v2 if usage justifies)

If a request matches any of the above, state which item, refer to PRD.md § Out of scope.

## Where to look first

| Question | File |
|----------|------|
| Why does this product exist? | `PRD.md` § What + Why |
| What's the API shape? | `PRD.md` § API surface |
| How do I add an export format? | `apps/worker/src/bankstract_cloud/writers/` |
| How is auth wired? | `apps/web/src/lib/auth.ts` + `proxy.ts` (Better Auth; sessions in `apps/web/data/auth.db`, gitignored, self-host bundle intact) + `apps/worker/src/bankstract_cloud/auth.py` (separate API-key bearer path) |
| How is billing wired? | Paystack NGN subscriptions (PRD § Pricing). Worker: `paystack.py` (client + HMAC webhook verify), `subscriptions.py` (state store + webhook dispatch), `usage.py` (overage), `routes/billing.py` (endpoints). 402 gate in `routes/parse.py`. `apps/web` proxies via `/api/billing/init`; worker holds the secret. |
| What's the privacy posture? | `CLAUDE.md` § Directive 1 + `PRD.md` § Privacy posture |
| Why AGPL not MIT? | `CLAUDE.md` § Directive 3 + `PRD.md` § License |
| How do I add a new bank? | NOT here. Engine repo: `github.com/logickoder/bankstract` § CONTRIBUTING |
| Why aren't there bank-parser files? | Same answer. Engine repo owns the parsers; Cloud consumes via PyPI |
| Visual brand reference | `DESIGN.md` (tokens, components, page structure, references, anti-patterns) |
