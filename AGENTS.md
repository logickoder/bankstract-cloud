# bankstract-cloud - Agent Operating Charter

You are working inside `bankstract-cloud`, the public AGPL-3.0 SaaS layer over the `bankstract` engine. Primary product: a B2B statement-parsing API (`/v1/parse`) for Nigerian fintechs, bookkeeping SaaS, and tax-prep startups. Secondary surface: a free drag-drop demo at `/demo`.

Owner: Jeffery Orazulike (github.com/logickoder).

Sibling repo: github.com/logickoder/bankstract (the Python engine, MIT). This repo consumes it from PyPI. Never vendor or fork the engine source. Parsers and new banks live there.

## CORE DIRECTIVES

Short form. Each links to the full rule in `docs/rules/`. Read the linked rule before working in its area.

1. **Privacy is the product.** PDF bytes stay in memory. Nothing from a statement is logged or stored. [privacy](docs/rules/privacy.md)
2. **Secrets never commit.** Public repo. Env only. [secrets](docs/rules/secrets.md)
3. **AGPL-3.0, respect the copyleft.** Headers on every source file. [license](docs/rules/license.md)
4. **Human in the loop.** No commit, push, PR, merge, publish, or deploy without an explicit owner command. [workflow](docs/rules/workflow.md)
5. **Surgical edits.** Touch the app or package under request. Surfaces stay decoupled. [workflow](docs/rules/workflow.md)
6. **Zero hallucination on business logic.** Read the code, point at the constant. [workflow](docs/rules/workflow.md)
7. **No boilerplate comments.** [code-style](docs/rules/code-style.md)
8. **Tone.** Direct, technical, honest. [voice](docs/rules/voice.md), [workflow](docs/rules/workflow.md)
9. **Strict type-checking is green or bust.** TS strict, pyright strict, zero warnings. [code-style](docs/rules/code-style.md)

## REPO LAYOUT

```
bankstract-cloud/
├── AGENTS.md                  this charter
├── PRD.md                     product spec (public)
├── DESIGN.md                  visual system: tokens, components, page structure
├── README.md / CONTRIBUTING.md / SECURITY.md / CHANGELOG.md
├── LICENSE / LICENSE_HEADER.txt   AGPL-3.0 + the short source-file notice
├── package.json / pnpm-workspace.yaml / turbo.json   pnpm workspaces + Turbo (overrides pin advisories)
├── .env.example               documented env vars
├── apps/
│   ├── web/                   Next.js 16: THE prod runtime. Route groups (marketing) / (demo) / (app):
│   │                          marketing /, demo /demo, dashboard + /sign-in + /api/*
│   ├── marketing/             thin shell over packages/marketing (extractable, off the prod path)
│   ├── demo/                  thin shell over packages/demo (the infra/ self-host deploy target)
│   ├── docs/                  Fumadocs: guides + openapi.json. Cloudflare Pages, served at /docs
│   └── worker/                FastAPI over the engine: /v1/parse (+ jobs), keys, billing, audit
│       └── src/bankstract_cloud/
│           ├── engine.py      parse_statement (parse → reconcile_result → serialize), error mapping
│           ├── routes/        parse, keys, billing, account, health
│           ├── models.py      documents the /v1 wire shape (OpenAPI + contract test)
│           ├── jobs.py        in-memory JobStore + the engine semaphore
│           └── migrations/    hand-written Alembic, no ORM
├── packages/
│   ├── marketing/ demo/       surface code, consumed by apps/web + the thin shells
│   ├── statement-table/       the parsed-statement table (demo + /for-lenders)
│   ├── types/                 TS wire types mirroring models.py
│   ├── sdk/                   @logickoder/bankstract TypeScript SDK
│   ├── format/                money + date display helpers
│   ├── ui/ seo/               shadcn components; metadata, robots, OG
│   └── tsconfig/ eslint-config/
├── infra/                     public self-host bundle (worker + thin demo): the AGPL claim
├── infra-prod/                owner prod stack (worker + web + Caddy + R2 backup)
└── docs/rules/                agent rules, one topic per file
```

## COMMANDS

```bash
# install (TS + Python)
pnpm install
cd apps/worker && uv sync --all-extras && cd ../..

# dev: the prod-shaped local stack (worker :8000 + web)
pnpm dev:all

# dev: one app
pnpm --filter web dev
pnpm --filter docs dev
cd apps/worker && uv run uvicorn bankstract_cloud.main:app --reload

# lint + types (MUST pass clean, directive 9)
pnpm lint
pnpm typecheck
cd apps/worker && uv run ruff check . && uv run ruff format --check . && uv run pyright .

# test
pnpm test
pnpm --filter demo test:e2e
pnpm --filter web test:e2e
cd apps/worker && uv run pytest

# after a wire change: regenerate the docs spec (CI diffs it)
cd apps/worker && uv run python scripts/export_openapi.py

# build + dependency gate (CI runs both)
pnpm build
pnpm audit --audit-level=moderate

# self-host bundle (verifies the AGPL claim)
docker compose -f infra/docker-compose.yml up --build
```

## OUT OF SCOPE - DO NOT ADD

- Category inference (rule-based or ML). Downstream concern.
- Mobile native client. Not v1.
- Multi-tenant org accounts. Not v1.
- Whitelabel for accounting firms. Not v1.
- Direct bank API integrations (Mono / Okra wrappers). Different product.
- Pyodide / WASM in-browser parsing. v2 if usage justifies.
- Categorization, budgeting, dashboards on top of parsed data. Downstream concern.
- Direct push to BudgetBakers / YNAB / Notion / Google Sheets. Cloud returns JSON; integrations belong in customer code.
- Statement-download automation (logging into bank portals). Separate tool.

If asked to add any of the above, push back. Name the item and refer to PRD.md § Out of scope.

## RULES

One topic per file in `docs/rules/`, the single source of truth. `.claude/rules/` holds thin wrappers (frontmatter plus an `@` import) that Claude Code loads by path. Edit the source in `docs/rules/`, never the wrapper.

| Rule | Covers |
|---|---|
| [privacy](docs/rules/privacy.md) | in-memory PDF flow, what is never logged or stored, audit schema |
| [secrets](docs/rules/secrets.md) | env-only secrets, pre-commit live-key block, test prefixes |
| [license](docs/rules/license.md) | AGPL headers, what inherits and what doesn't, self-host bundle |
| [worker](docs/rules/worker.md) | engine import, one parse path, serialize() wire contract, concurrency, jobs, redaction, migrations |
| [api](docs/rules/api.md) | `/v1/parse` shape, error envelope, free-tier cap (no 429), API keys, wire types |
| [billing](docs/rules/billing.md) | Paystack NGN tiers, overage, 402 gate, webhooks |
| [frontend](docs/rules/frontend.md) | one web runtime, surface packages, auth, Turnstile |
| [code-style](docs/rules/code-style.md) | strict types, TS idiom (no prettier), comments |
| [testing](docs/rules/testing.md) | test layout, shared fakes, e2e, fixture privacy |
| [workflow](docs/rules/workflow.md) | human in the loop, surgical edits, commits, PRs, response format |
| [voice](docs/rules/voice.md) | copy, docs, errors, commits. No em-dashes |
| [infra](docs/rules/infra.md) | prod box, routing, deploy workflows, self-host |

## WHERE TO LOOK FIRST

| Question | File |
|---|---|
| Why does this product exist? | `PRD.md` § What + Why |
| What's the API shape? | [api](docs/rules/api.md), `apps/docs/openapi.json`, `PRD.md` § API surface |
| How is auth wired? | `apps/web/src/lib/auth.ts` (Better Auth, dashboard sessions) + `apps/worker/src/bankstract_cloud/auth.py` (API-key bearer) |
| How is billing wired? | [billing](docs/rules/billing.md) |
| Why AGPL, not MIT? | [license](docs/rules/license.md) + `PRD.md` § License |
| How do I add a bank? | Not here. The engine repo, § CONTRIBUTING |
| Visual brand reference | `DESIGN.md` |
