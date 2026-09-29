# Code style

## Types are green or bust

- TypeScript: `strict: true` + `noUncheckedIndexedAccess: true`. Zero `any` (use `unknown` + narrow). Zero `@ts-ignore` (use `@ts-expect-error` with an explanation).
- Python (`apps/worker`): pyright strict. Zero errors, zero warnings. Type every public function; no untyped boundary past the FastAPI handler. pydantic v2 for models.
- ESLint: `eslint-plugin-import` strict, `no-unused-vars` is an error.
- Ruff: lint + format, same config as the engine.

## TypeScript idiom

Single quotes, no semicolons, enforced by `@stylistic` in `packages/eslint-config`. There is no prettier config. Never run prettier or a formatter on TS/TSX: it rewrites to its defaults. Match neighbouring code and let ESLint judge.

## Comments

A comment earns its place when removing it would confuse a future reader. No `// validate input` above `validate()`. No JSDoc on obvious functions.

```ts
// Cloudflare Turnstile sends the token via formData NOT JSON body.
// Don't fetch req.json(). The multipart parser eats the PDF.
const formData = await req.formData()
```

## Stack

- Monorepo: `pnpm` workspaces + `turbo`.
- Worker: FastAPI + uvicorn, `uv` for env and deps, `pytest`.
