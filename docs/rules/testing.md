# Testing

## Where tests live

- TS: `apps/<app>/__tests__/` or co-located `*.test.ts` (vitest).
- Worker: `apps/worker/tests/` (pytest). Shared helpers in `tests/conftest.py`: `fake_parse`, `empty_parse_result`, `txn`. Fakes stand in for `bankstract.parse` only; the real `reconcile_result` and `serialize` still run.
- E2E: Playwright in `apps/demo` and `apps/web` (`pnpm --filter <app> test:e2e`) for the critical flows: hero render, demo upload, sign-in, billing.
- CI runs worker, web (lint, typecheck, test, build, `pnpm audit`), and e2e on every PR. Deploy runs only from `main`.

## Fixture privacy

Mirrors the engine rule. Non-negotiable.

- No real bank PDFs in this repo, ever. Tests use synthetic data, or the engine's committed redacted fixtures via a local path in dev.
- No real names, account numbers, BVN, or addresses in source. Use `FOO`, `BAR`, `ACME`, `1111 2222`.
- Scratch copies for manual checks go under `_local/` (gitignored) and get deleted after.
