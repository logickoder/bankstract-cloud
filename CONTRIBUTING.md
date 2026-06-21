# Contributing

Public AGPL-3.0 repo. PRs welcome.

## Accepted

- App fixes and improvements (`apps/*`)
- Documentation improvements
- Bug fixes and security disclosures (see [`SECURITY.md`](./SECURITY.md))

## Not accepted

- **New bank parsers.** Those belong in the engine repo, [`bankstract`](https://github.com/logickoder/bankstract). This repo consumes the engine via PyPI; it does not contain parsers.
- **Export-format writers** (CSV/XLSX/QIF/BudgetBakers, etc.). The API returns ParseResponse JSON or engine-redacted bytes. Converting to a downstream wallet format is the consumer's job (e.g. the BudgetBakers Wallet importer owns its own import). The worker does not host writers.
- Category inference / ML transaction tagging: out of scope (see [`PRD.md`](./PRD.md) § Out of scope).
- Direct bank-portal or open-banking integrations: different product.

If a change matches the "not accepted" list, it will be closed with a pointer to the right home.

## Ground rules

1. **No real bank data, ever.** No real names, account numbers, BVN, or addresses anywhere: code, fixtures, tests, or issues. Use `FOO`, `ACME`, `1111 2222`. Worker tests use synthetic PDFs only.
2. **No secrets in commits.** Dev keys use `test_` / `bsk_test_` prefixes. The pre-commit scan halts on `sk_live_`, `pk_live_`, `PAYSTACK_SECRET_KEY=` (`sk_live_`/`pk_live_` are Paystack live keys).
3. **PDF bytes stay in memory.** No code path may write a PDF to disk or log its contents. PRs that do are rejected on sight.
4. **AGPL header on new source files.** Every `.ts`/`.tsx`/`.py` in `apps/` and `packages/` starts with the SPDX short form:
   ```
   SPDX-License-Identifier: AGPL-3.0-only
   Copyright (C) 2026 Jeffery Orazulike
   ```

## Checks must be green

```bash
pnpm lint && pnpm typecheck && pnpm test
cd apps/worker && uv run ruff check . && uv run pyright . && uv run pytest
```

TypeScript is `strict` with `noUncheckedIndexedAccess`. Python is `pyright` strict + `ruff`. Zero errors, zero warnings. No `any`, no `@ts-ignore` (use `@ts-expect-error` with a reason).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/). Types: `feat`, `fix`, `perf`, `chore`, `docs`, `refactor`, `test`, `ci`, `style`, `build`, `revert`.

```
feat(worker): add /v1/banks endpoint
fix(demo): validate Turnstile token before forwarding to worker
```

Subject in the imperative, ≤ 72 chars. Body explains *why* when it is not obvious. Direct and technical, no "I've gone ahead and...".

## PRs

- One concern per PR. Touch the specific app/package under change; each app is independently deployable.
- Describe the change, the reasoning, and how you verified it.
- CI runs lint + typecheck + test on every PR. Deploys happen from `main` after manual review.
