# bankstract-cloud: PRD

**Status:** concept · v1 target Q3 2026
**License:** AGPL-3.0
**Stack:** TypeScript (Next.js 16) + Python (FastAPI)
**Engine dependency:** [github.com/logickoder/bankstract](https://github.com/logickoder/bankstract) (MIT)

---

## What

Hosted SaaS layer on top of the `bankstract` open-source Python engine.

Three-layer architecture:
 
| Layer | Repo | License | Audience |
|-------|------|---------|----------|
| OSS engine | `bankstract` | MIT | Devs who run CLI / `pip install` |
| **Hosted API** | `bankstract-cloud` (this repo) | **AGPL-3.0** | **Fintechs, bookkeeping SaaS, tax-prep startups** (primary revenue path) |
| Consumer demo | same repo, `apps/demo` | AGPL-3.0 | Individuals who want a one-off PDF → CSV conversion |

Primary surface: REST API at `/v1/parse` for programmatic statement ingestion.
Secondary surface: browser drag-drop demo (free for personal use) that doubles as API showcase.

```bash
# B2B integration
curl -X POST https://bankstract.logickoder.dev/v1/parse \
  -H "Authorization: Bearer bsk_live_xxx" \
  -F "pdf=@statement.pdf"
```

```ts
// TS SDK (planned)
import { bankstract } from "@bankstract/sdk"
const client = bankstract({ apiKey: process.env.BANKSTRACT_API_KEY! })
const result = await client.parse(pdfBuffer)
```

## Why

- **No Plaid-equivalent in Nigeria.** Lending fintechs, bookkeeping SaaS, and tax-prep startups currently build statement-ingest internally, badly. Plaid / Mono / Okra solve open-banking via direct bank API integrations, but statement-PDF parsing remains a per-vendor reinvented wheel.
- **OSS engine = trust signal for B2B procurement.** AGPL Cloud + MIT engine = auditable end-to-end. Fintech security review can verify the parsing logic in `bankstract` before signing a Cloud contract.
- **B2B headline reads sharper than consumer.** "If you're building a budget app and want to auto-import users' statements, use this" pitches itself. Different buyer, different willingness-to-pay, different sales motion than chasing individual prosumer SaaS.
- **Consumer demo doesn't compete with B2B.** Drag-drop ≠ programmatic ingest. Free consumer funnel feeds B2B inbound, never cannibalizes it.

## Pricing

NGN-anchored monthly subscriptions. Nigeria-first indefinitely. International USD surface deferred until the first US/EU lead.

### Tiers

| Tier | Price (NGN) | Cap | Overage | API key | SLA |
|------|-------------|-----|---------|---------|-----|
| Self-host | ₦0 | unlimited | n/a | n/a (run your own engine) | best-effort, community Discord |
| Free demo | ₦0 | 50 parses/mo per IP | hard-stop | no | none. anonymous, Turnstile-gated, watermarked outputs |
| Starter | ₦9,500/mo | 1,000 parses/mo | ₦15/parse | yes | email support, no uptime guarantee |
| Growth | ₦35,000/mo | 10,000 parses/mo | ₦12/parse | yes | priority email + Discord, 99% target |
| Scale | ₦150,000/mo | 100,000 parses/mo | ₦8/parse | yes | dedicated Slack, 99.5% SLA |
| Enterprise | Custom (₦500k to ₦5M/mo band) | unlimited | negotiated | yes + per-key rate limits | dedicated Slack, 99.9% SLA, NDPR audit support, on-prem option |

Annual prepay: 15% off across all paid tiers (Starter ₦96,900, Growth ₦357,000, Scale ₦1,530,000).

### Payment processor

Paystack only. NGN cards and NGN bank transfer. Subscriptions drive monthly billing. Overage is metered in-app and charged via Paystack Invoices at end of cycle. Webhook signatures verified with HMAC-SHA512 against the Paystack secret key. API key lifecycle is bound to subscription state: an inactive subscription returns `402` with `error_class: subscription_inactive`.

### Not in v1 pricing

- USD card collection (Paystack USD endpoint exists, deferred until a non-Nigerian lead)
- Stripe / Stripe Atlas (Nigeria-first indefinitely; revisit only on a US/EU enterprise contract)
- Lifetime deal one-shots (wrong audience for Nigerian fintech infra)
- Pay-as-you-go without a subscription (overage requires an active sub)
- Volume-discount cliffs inside Starter/Growth (Scale is the volume tier)
- Per-bank parser surcharges (all banks included on all paid tiers)

### Refund posture

Pro-rated refund within the first 7 days of any paid tier. After 7 days the current cycle is non-refundable, cancel any time. Enterprise refunds per contract.

### Tax

Prices are VAT-inclusive. The owner's business entity issues FIRS-compliant tax invoices on request via the dashboard `Download invoice` action.

> **Implementation status (2026-06-22):** the pricing decision is canonical and the Paystack migration has landed. Worker billing lives in `paystack.py` / `subscriptions.py` / `usage.py` / `routes/billing.py`, with the live-key `402 subscription_inactive` gate in `routes/parse.py`. The dashboard checkout (`apps/app` Billing page → `/api/billing/init` → worker) is in place. Overage auto-invoicing is landed: an in-process daily scheduler (`billing_cron.py`) bills each closed cycle, idempotent per `(owner, cycle)` and self-healing across restarts, with per-cycle tier economics frozen in `cycle_tiers`. The overage metering window is the UTC calendar month (cap resets on the 1st, not the subscription anchor); the overage invoice is a separate Paystack charge from the base-fee renewal. Both `/v1/usage` and the cron read that one window definition (`audit.py`).

## Privacy posture (LOCKED)

The single load-bearing trust claim is: **we process in memory, we never write your PDF to disk, we never log file contents.**

- PDF bytes flow: client → FastAPI worker → `BytesIO` → `bankstract.parse(stream)` → JSON response → garbage collected
- No PDF writes to disk
- No logging of PDF contents, transaction details, account holders, balances
- Audit log = metadata only: filename, byte count, parser detected, success/fail timestamp, API key ID (or anonymous)
- User records (dashboard accounts + sessions) live in our own database on Hetzner EU infra (Better Auth, self-hosted), not an external auth provider. No login-path subprocessor.
- No persistence of `ParseResult.transactions` or `metadata`
- Worker source open under AGPL-3.0. Anyone can audit the claim

Honest copy:
- "Processed in memory. Never written to disk. Worker re-uses a buffer that's released after every parse."
- "No logging of file contents. Audit log captures filename + byte count + parser detected + success/fail timestamp only."
- "Self-host with `docker compose up` if you don't trust us."

**Forbidden copy:** "we never see your data." Server-side parsing means we briefly see data ephemerally. Owning the truthful framing is the differentiator.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend (marketing, app, docs, demo) | Next.js 16 + Tailwind v4 + shadcn/ui + Magic UI |
| Auth (B2B/app) | Better Auth (self-hosted; users + sessions in our own SQLite, not an external auth provider) |
| Auth (consumer demo) | Anonymous + Cloudflare Turnstile + per-IP rate limit |
| Worker | FastAPI + uvicorn, imports `bankstract` directly |
| Hosting | Hetzner CAX11 (ARM, 2 vCPU, 4GB) + Coolify + Cloudflare in front |
| Domain | `bankstract.logickoder.dev` (subdomain, free, inherits SSL from owned `logickoder.dev`). Pivot to standalone TLD when first B2B contract revenue justifies. |
| Payments | Paystack (NGN subscriptions, see § Pricing). Worker holds the secret; `apps/app` proxies checkout |
| Audit log | SQLite on worker box, backed up nightly to Hetzner Storage Box |
| Email transactional | Resend |
| Error tracking | Sentry free tier |
| Uptime monitoring | UptimeRobot free tier |
| Monorepo tooling | pnpm workspaces + Turborepo |

Total fixed cost: **~₦5–6k/mo (~$4–5/mo)**. Domain: ₦0 (subdomain on owned `logickoder.dev`). Backup: Cloudflare R2 free tier (10 GB egress + storage). Indie-shippable.

## Architecture

```
                                    ┌──────────────────┐
                                    │  Next.js 16 apps │
   Browser ──── HTTPS ──── CF ──────┤  (Hetzner+Coolify│
                                    │   marketing /    │
                                    │   app /          │
                                    │   docs /         │
                                    │   demo)          │
                                    └────────┬─────────┘
                                             │
                                             │ POST /v1/parse
                                             │ (multipart PDF + API key
                                             │  or Turnstile token)
                                             ▼
                                    ┌──────────────────┐
                                    │  FastAPI worker  │
                                    │  (same box)      │
                                    │  imports         │
                                    │  bankstract lib  │
                                    └────────┬─────────┘
                                             │
                                             │ in-memory parse
                                             │ BytesIO → ParseResult
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  Audit log       │
                                    │  (metadata only) │
                                    │  → SQLite        │
                                    └──────────────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  Overage meter   │
                                    │  (cap vs success │
                                    │   count, live)   │
                                    └──────────────────┘
```

## Repo layout

```
bankstract-cloud/
├── LICENSE                       AGPL-3.0
├── LICENSE_HEADER.txt            short AGPL notice for source files
├── SECURITY.md                   disclosure policy
├── CONTRIBUTING.md               PR + commit conventions
├── CODE_OF_CONDUCT.md            standard
├── PRD.md                        this file
├── AGENTS.md                     AI agent quick-ref
├── CLAUDE.md                     Claude Code charter
├── README.md                     human entry point
├── package.json                  root, pnpm workspaces + Turbo scripts
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example                  documented env vars
├── apps/
│   ├── marketing/                Next.js 16: landing, pricing, OSS callout
│   ├── app/                      Next.js 16: developer dashboard (Better Auth, API keys, usage, billing)
│   ├── docs/                     Mintlify or Fumadocs: OpenAPI spec + integration guides
│   ├── demo/                     Next.js 16: consumer drag-drop showcase
│   └── worker/                   FastAPI: wraps bankstract engine
├── packages/
│   ├── ui/                       shadcn components shared across Next.js apps
│   ├── types/                    TS types mirroring engine ParseResult
│   ├── tsconfig/                 shared tsconfig presets
│   └── eslint-config/            shared ESLint config
└── infra/
    ├── docker-compose.yml        self-host bundle: verifiable AGPL self-host claim
    ├── Caddyfile                 reverse proxy
    └── README.md                 self-host walkthrough
```

## API surface

### B2B (`/v1/*`)

```
POST /v1/parse
  Authorization: Bearer bsk_live_xxx
  Content-Type: multipart/form-data
  body: pdf=<file>
  optional:
    bank=<name>          skip auto-detect
    redact=true          run redactor, returns redacted file bytes (PDF or XLSX) directly

Response 200 (default, no redact):
  ParseResponse JSON (wire contract: apps/worker/src/bankstract_cloud/models.py,
  decoupled from engine ParseResult dataclass internals)
  {
    "format_version": "fbn-2026-01",
    "metadata": { ... },
    "totals": { "credit": "...", "debit": "..." },
    "transactions": [ ... ]
  }

Response 200 (redact=true):
  Raw redacted file bytes (PDF or XLSX) with Content-Type matching source format.
  Headers carry the metadata ParseResponse exposes in JSON mode:
    Content-Type: application/pdf
                | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    X-Bankstract-Bank: opay
    X-Bankstract-Format-Version: opay-pdf-2026-01
    X-Bankstract-Redactions: 11338

Response 401  invalid / missing API key
Response 402  subscription inactive (error_class: subscription_inactive)
Response 413  file too large (>50MB)
Response 422  no parser/redactor detected (unsupported bank or wrong format)
Response 429  rate limit exceeded
Response 500  internal parse error (response body includes format_version)
```

**Wire format ≠ engine internals.** Engine `ParseResult` + `StatementMetadata` are Python dataclasses (only `Transaction` is pydantic). Worker defines its own `ParseResponse` pydantic model in `apps/worker/src/bankstract_cloud/models.py` and serializes via `ParseResponse.from_engine(result)`. Decouples API surface from engine internals. Engine can rev internal types without breaking `/v1/*` clients.

**Redaction live as of engine 0.11.0.** `bankstract.redact(source, *, bank=None) -> RedactResult` returns in-memory bytes (no tempfile, no disk write, verified by engine tempfile-invariant test via TMPDIR monkeypatch). Worker streams `result.data` straight to HTTP response w/ Content-Type dispatch via `result.format`. Engine pin: `bankstract>=0.11.0` in `apps/worker/pyproject.toml`.

```
GET /v1/banks
  list of supported banks + format versions, derived live from engine's
  list_parsers() + list_redactors() at request time, NEVER a hardcoded
  marketing list. As of engine 0.11.0: fbn, opay, palmpay, zenith (4 parsers,
  4 redactors). Opay supports both PDF + XLSX formats; others PDF only.
```

```
GET /v1/usage
  Authorization: Bearer bsk_live_xxx
  current billing period usage + invoice projection
```

### Consumer demo (`/api/demo/*`)

Same `/v1/parse` handler internally; demo wrapper passes:
- Public demo API key (server-side)
- Cloudflare Turnstile token from client (server validates)
- Anonymous IP-based rate limit (50 parses/month per IP)

### Health

```
GET /healthz                      worker liveness
GET /readyz                       worker + engine + DB readiness
GET /v1/status                    public uptime + version info
```

## Canonical CSV schema (public contract)

Cloud emits ONE canonical CSV shape from `/v1/parse?format=csv`. Downstream tools (`budgetbakers-wallet-importer`, hypothetical YNAB importer, etc.) target this shape, not the other way around.

```
date,narration,debit,credit,balance,reference,currency
2026-05-01T00:00:00,FBN ALERT,50.00,0,531085.04,X00000000,NGN
2026-05-06T00:00:00,SALARY,0,300000.00,831085.04,X00000000,NGN
```

Schema rules:

| Column | Type | Format | Notes |
|--------|------|--------|-------|
| `date` | ISO-8601 | `YYYY-MM-DDTHH:MM:SS` | Always full timestamp; banks without time pad `00:00:00`. UTC offset omitted (statements are bank-local time). |
| `narration` | string | UTF-8 | Empty string for FBN-style narration-less rows |
| `debit` | decimal | string-encoded decimal | `"0"` (literal) for credit rows, never empty |
| `credit` | decimal | string-encoded decimal | `"0"` (literal) for debit rows, never empty |
| `balance` | decimal | string-encoded decimal | Empty string when statement omits running balance column (PalmPay) |
| `reference` | string | bank transaction ID | Empty string when bank omits it |
| `currency` | ISO-4217 | `NGN`, `USD`, etc. | Defaults to `NGN` |

Header row is required (column-name dispatch in consumer parsers, not positional).

**Semver promise:** column names + types + order are part of the public API. Adding a column = minor bump. Renaming or removing = major bump. Schema is locked at v1 launch.

`format=json` emits the `ParseResponse` shape documented in § API surface (with engine metadata wrapped). `format=csv` is data-only. Metadata is exposed via response headers (`X-Bankstract-Bank`, `X-Bankstract-Format-Version`, `X-Bankstract-Period-Start`, `X-Bankstract-Period-End`).

## CLI surface

Cloud does NOT ship its own CLI. The OSS engine CLI lives in the sibling `bankstract` repo:

```bash
pip install bankstract
bankstract auto statement.pdf -o out.csv
```

If a customer wants a "cloud-aware" CLI (uploads to hosted API), the SDK approach is preferred (`pnpm add @bankstract/sdk` or `pip install bankstract-cloud-sdk`). This keeps CLI ergonomics in the engine repo.

## Risks

| Risk | Mitigation |
|------|-----------|
| Bank format drift breaks paying customers | Engine release SLA: 48h fix on format drift. Discord channel for paid users to report. Format version logged in audit, surfaced in API error responses. |
| Single-box hosting outage (Hetzner) | Daily backup to Hetzner Storage Box. Status page transparent on incidents. Multi-region = v1.5+. |
| AGPL deters B2B procurement | Clarify in docs: AGPL applies to the hosted app, NOT to API consumers (HTTP boundary). Legal sub-page if friction surfaces. |
| Competitor fork-and-host | AGPL forces fork-host to open-source changes. BSL pivot reserved as escape hatch. |
| Overage edge cases (partial parses, billing for parse errors) | Bill on success only. Parse errors return an error response and never count toward the cap or overage. Document policy publicly. |
| NGN payment friction (consumer paywall, when introduced) | Paystack integration deferred; only ships if consumer paywall signal validates. |
| Privacy claim challenged by user / journalist | All code public. AGPL repo + docker-compose = verifiable. Honest copy ("we process in memory, we don't store") not overclaim ("we never see"). |

## Roadmap

### v1.0 (target: Q3 2026)

- [ ] Pre-decisions resolved: domain + Hetzner provisioned (Coolify) + Cloudflare zone + AGPL repo init
- [ ] Marketing landing (B2B hero w/ curl snippet, OSS callout, free-demo CTA, dual-CTA outro)
- [ ] FastAPI worker + `/v1/parse` endpoint w/ API key bearer auth + rate limit
- [ ] Paystack usage billing + self-serve API key issuance + dashboard (Better Auth, usage charts)
- [ ] Developer docs site (OpenAPI spec + curl/Python/TS examples + integration guides)
- [ ] Consumer "try it" demo (drag-drop → JSON preview + CSV/JSON download, anonymous + Turnstile + IP rate limit)
- [ ] Soft launch (Show HN + Twitter) + cold outbound to 5–10 lending fintechs

### v1.5 backlog

- [ ] Multi-bank consolidation endpoint (drag N PDFs → merged result)
- [ ] Transfer-pair detection across accounts
- [ ] Consumer paywall (Hobby/Pro tiers) IF usage signal validates
- [ ] Paystack integration for NGN consumer billing
- [ ] Opt-in 24h ephemeral history per signed-in user
- [ ] Status page (`status.bankstract.logickoder.dev`) once first B2B customer asks
- [ ] B2B SDK packages (`@bankstract/sdk` for TS, `bankstract-cloud` PyPI for Python)
- [ ] Webhook callbacks (async parse for files > sync threshold)

### v2 (post-launch evaluation)

- [ ] Pyodide / WASM in-browser parsing for demo (privacy posture upgrade)
- [ ] Mobile native client (KMP companion)
- [ ] Multi-tenant org accounts
- [ ] Custom bank format upload (B2B feature for niche banks)

## Out of scope (do NOT add)

- Category inference (rule-based or ML)
- Mobile native client at v1
- Multi-tenant orgs at v1
- Whitelabel for accounting firms
- Direct bank API integrations (Mono / Okra wrappers): different product
- Categorization, budgeting, dashboards on top of parsed data
- Direct push to BudgetBakers / YNAB / Notion / Google Sheets: customer code handles integrations
- Statement-download automation (logging into bank portals)

## Open questions

| # | Question | Lean | Resolution path |
|---|----------|------|-----------------|
| A | Anti-abuse on consumer demo: signup-required vs anonymous w/ Turnstile | Anonymous w/ Turnstile + IP rate limit | Lock pre-build |
| B | File size cap | 50 MB hard cap, browser pre-flight check | Lock pre-build |
| C | Result expiry | HTTP response only, no re-download | Lock pre-build |
| D | B2B onboarding flow | Self-serve API key + Paystack subscription billing | Lock pre-build |
| E | Logging stack | stdout + Sentry + UptimeRobot | Lock pre-build |
| F | Export format coverage at v1 | **Generic CSV + JSON only.** Cloud emits one canonical CSV shape (owner-controlled, documented in PRD § Canonical CSV schema). BB-Wallet's proprietary import format dropped (third-party drift risk). Sibling tool `budgetbakers-wallet-importer` adds a `bankstract-csv` reader in its own repo. The impedance match lives in the consumer tool, not in Cloud. Future tool integrations (YNAB, Money Manager, etc.) follow the same pattern: ship as standalone importers reading the canonical CSV, never as Cloud writers. | Lock pre-launch |
| G | Email transactional | Resend | Lock pre-launch |
| H | Marketing channels for soft launch | Show HN + Twitter, PH 2 weeks later | Lock at launch |
| I | Privacy policy + ToS | Hand-rolled minimal v1, lawyer review pre-first-B2B | Lock pre-launch |
| J | Status page | Defer to v1.5 (first B2B customer asks) | Defer |

## Design

See [`DESIGN.md`](./DESIGN.md): single source of truth for visual tokens, components, page structure, references, and anti-patterns. Do not duplicate design rules in this file.

## Contributing

Public AGPL-3.0 repo. PRs welcome on:
- App fixes + improvements
- Documentation improvements
- New export formats (in `packages/ui` + `apps/worker` writers layer)
- Translation / localization (v1.5+)
- Bug fixes + security disclosures (see SECURITY.md)

NOT accepted:
- New bank parsers: those belong in `github.com/logickoder/bankstract` (engine repo)
- Category inference / ML features: out of scope (see § Out of scope)
- Direct bank-portal integrations: different product

See `CONTRIBUTING.md` for the PR + commit conventions.

## License

AGPL-3.0. See `LICENSE`. Engine (`bankstract`) is MIT; this repo CONSUMES the engine via `pip install bankstract`.

API consumers do NOT inherit AGPL. They interact via HTTP boundary, not source-level dependency. SaaS-hosted forks must open-source modifications.
