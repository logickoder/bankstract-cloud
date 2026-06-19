# Security Policy

## Reporting a vulnerability

Email **jeffreyliaison@gmail.com** with subject `SECURITY: bankstract-cloud`. Do not open a public issue for an unpatched vulnerability.

Include: affected component (`apps/worker`, an app, a package), reproduction steps, and impact. A synthetic PDF that triggers the issue is welcome — **never send a real bank statement** (see the privacy posture below).

Expect an acknowledgement within 72 hours and a triage assessment within 7 days.

## Scope

In scope:
- The hosted API (`/v1/parse` and other `/v1/*` endpoints)
- Authentication and API key handling (`apps/worker`)
- Billing and rate-limit bypasses
- The Next.js apps (`apps/marketing`, `apps/app`, `apps/demo`)
- The self-host bundle (`infra/`)

Out of scope (report upstream):
- Parsing logic and bank format handling — these live in the engine, [`bankstract`](https://github.com/logickoder/bankstract).

## Privacy is the product

The load-bearing trust claim: **PDF bytes are processed in memory and never written to disk; file contents are never logged.** Any finding that breaks this — a code path that persists PDF bytes, logs transaction data, or stores `ParseResult` payloads — is treated as a high-severity vulnerability regardless of exploitability.

The audit log is metadata only: `(id, timestamp, api_key_id_or_anonymous, filename, byte_count, parser_detected, success, error_class)`. A finding that shows payload data leaking into the audit log, application logs, or error tracking qualifies.

## Disclosure

Coordinated disclosure. We will agree on a public disclosure date after a fix ships. Credit is given unless you prefer anonymity.
