# Workflow

## Human in the loop

Never run `git commit`, `git push`, `git tag`, `gh pr create`, `gh pr merge`, `gh release create`, `pnpm publish`, `docker push`, or any deploy or state-publishing step without an explicit owner command in the current turn. Edit, save, halt. Approval for one step does not cover the next.

## Surgical edits

Touch the app or package under request. Don't refactor across `apps/web`, `apps/worker`, and the surface packages (`packages/marketing`, `packages/demo`) in one pass unless explicitly tasked. The surfaces are separate packages and route groups so they stay decoupled.

## Zero hallucination on business logic

Billing, rate-limit math, API key issuance, parser orchestration: read the code, confirm the schema, run the endpoint. Never write "I think the rate limit is 10/hour". Grep for it and point at the constant.

## Commits and PRs

- Conventional Commits (CONTRIBUTING.md): `feat`, `fix`, `perf`, `chore`, `docs`, `refactor`, `test`, `ci`, `style`, `build`, `revert`. `!` marks a breaking change.
- Split work into logical commits. Each passes the pre-commit hook on its own.
- Subject imperative, 72 chars or less. Body explains why when it isn't obvious.
- One concern per PR. Describe the change, the reasoning, and how it was verified.
- Merging to `main` deploys (infra-prod + docs workflows). Treat a merge as a deploy.

## Response format

- State change: terse confirmation with file + function name.
- Diagnosis: root cause in one to two sentences, then the fix.
- Refusal: cite the rule being upheld, e.g. "privacy. PDF bytes stay in memory. Cannot use `NamedTemporaryFile`. Use `BytesIO`."
- Direct, technical, honest. No "I've gone ahead and...", no "Let me know if...". Never apologize. Acknowledge errors technically and move on.
