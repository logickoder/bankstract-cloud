# bankstract-cloud

Hosted statement parsing API for Nigerian banks. A public [AGPL-3.0](./LICENSE) SaaS layer on top of the [`bankstract`](https://github.com/logickoder/bankstract) open-source engine (MIT).

Built by [logickoder](https://github.com/logickoder).

```bash
curl -X POST https://bankstract.logickoder.dev/v1/parse \
  -H "Authorization: Bearer bsk_live_xxx" \
  -F "pdf=@statement.pdf"
```

Returns clean transactions, account metadata, and totals as JSON. The PDF is parsed in memory and never written to disk.

## What this is

| Layer | Repo | License | Audience |
|-------|------|---------|----------|
| OSS engine | [`bankstract`](https://github.com/logickoder/bankstract) | MIT | Devs who run the CLI / `pip install` |
| Hosted API | `bankstract-cloud` (this repo) | AGPL-3.0 | Fintechs, bookkeeping SaaS, tax-prep startups |
| Consumer demo | this repo, `apps/demo` | AGPL-3.0 | Individuals doing one-off PDF → CSV |

This repo **consumes** the engine via `pip install bankstract`. It never vendors or forks the engine source. New bank parsers belong in the engine repo, not here.

## Privacy posture

PDF bytes flow: client → worker → `BytesIO` → `bankstract.parse(stream)` → JSON response → garbage collected. No disk writes. No logging of file contents. The audit log is metadata only (filename, byte count, parser detected, success/fail timestamp). All source is public. Verify the claim, or self-host with `docker compose up`.

API consumers interact over HTTP and do **not** inherit AGPL. A SaaS-hosted fork must open-source its modifications.

## Repo layout

```
apps/
  marketing/   Next.js 16: landing
  app/         Next.js 16: dev dashboard (Clerk + Paystack)
  docs/        Fumadocs: API docs
  demo/        Next.js 16: anonymous drag-drop (Turnstile)
  worker/      FastAPI: wraps the bankstract engine, exposes /v1/parse
packages/
  ui/          shared shadcn components
  types/       TS types mirroring the engine ParseResult
  tsconfig/    shared tsconfig presets
  eslint-config/ shared ESLint config
infra/
  docker-compose.yml   self-host bundle
  Caddyfile            reverse proxy
```

> Scaffold status: root config + `apps/worker` are live. Other apps/packages land in subsequent passes.

## Develop

```bash
pnpm install                              # TS workspaces
cd apps/worker && uv sync --all-extras    # Python worker

pnpm dev                                  # all TS apps via Turbo
cd apps/worker && uv run uvicorn bankstract_cloud.main:app --reload

pnpm lint && pnpm typecheck && pnpm test  # TS gates
cd apps/worker && uv run ruff check . && uv run pyright . && uv run pytest
```

## Documentation

- [`PRD.md`](./PRD.md): product spec
- [`DESIGN.md`](./DESIGN.md): visual design system
- [`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md): agent operating charter
- [`SECURITY.md`](./SECURITY.md): vulnerability disclosure
- [`CONTRIBUTING.md`](./CONTRIBUTING.md): PR + commit conventions

## License

[AGPL-3.0-only](./LICENSE). The `bankstract` engine is MIT and consumed as a runtime dependency.
