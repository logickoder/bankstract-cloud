# Worker

`apps/worker`: FastAPI over the `bankstract` engine. Python 3.11+, `uv`, current engine pin `bankstract>=0.17.1` (`pyproject.toml`).

## Import the engine, never shell out

```python
# CORRECT
import bankstract
result = bankstract.reconcile_result(bankstract.parse(buf))

# WRONG: process spawn, CLI version drift, temp files
subprocess.run(["bankstract", "auto", "-"], input=pdf_bytes)
```

Never vendor or fork engine source. Parsers live in the engine repo (github.com/logickoder/bankstract). A new bank is an engine change.

## One parse path

`engine.parse_statement(data, fmt=...)` is the only JSON/CSV path: `parse` → `reconcile_result` → `serialize`.

- `parse()` does not reconcile. That is the engine's design (consumers choose). The worker always opts in via `reconcile_result`.
- A failed totals or running-balance check, or a statement with evidence for neither, raises `ReconciliationError` → 422. Never return unchecked numbers.
- `_translate_engine_errors` maps engine errors to the envelope. `ParseError` and `ReconciliationError` both carry `bank` + `format_version`; they feed the 422 body and the audit row.
- `parser_detected` comes from `result.bank` / `exc.bank`. No separate `detect()` pass.

## The wire is the pinned engine's serialize()

`/v1` JSON and CSV are the engine's own canonical bytes, not a worker mapping. The wire is still a versioned contract, never engine internals:

- An engine shape change reaches clients only when the pin moves. A breaking one means `/v2` or holding the pin.
- `models.py` documents the shape for OpenAPI and types the job snapshot.
- `tests/test_contract.py` fails CI if the pinned engine's JSON stops round-tripping through `ParseResponse`.
- Never return `dataclasses.asdict(result)` or any hand-built dict of engine internals.
- Demo JSON gets its `_demo` envelope in one place, `_demo_json` in `routes/parse.py`.

## Concurrency

- The engine runs in `asyncio.to_thread` on every path, sync and async. A long parse must not block SSE streams and polls.
- Every engine call holds `state.jobs.semaphore`. `parse_max_concurrent` (config.py) caps engine threads across sync and async together: pdfplumber peaks at 150-300MB on a large statement, on a shared 4GB box.
- The worker MUST stay single-process (no uvicorn `--workers`). The job store is in memory.

## Async jobs

`POST /v1/parse/jobs` → SSE stream + poll fallback. `jobs.py` holds the in-memory `JobStore` (semaphore, capability lookup, TTL eviction); routes in `routes/parse.py`.

- The engine's `progress_callback` (throttled via `bankstract.throttle`) marshals events onto the job queue.
- The stream sees `done`, `reconcile`, `done` (two top-level engine calls). Only job state is terminal.
- The SSE stream takes no Authorization header: the unguessable `job_id` is the capability (EventSource cannot send headers). One consumer per job.
- The demo drives jobs through same-origin `/api/parse/jobs` proxies (`packages/demo/src/api/jobs.ts`) so `DEMO_API_KEY` stays server-side.

## Redaction

`bankstract.redact(buf, bank=bank)` → `RedactResult(data, bank, format, format_version, report)`. Return `result.data` with the matching Content-Type and `X-Bankstract-Redactions` / `X-Bankstract-Format-Version` headers.

## Storage

SQLite (`audit.sqlite`), raw `sqlite3`, no ORM. Schema changes are hand-written Alembic migrations in `migrations/` (see its README). They run at boot.
