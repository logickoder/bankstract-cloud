# Worker

`apps/worker`: FastAPI over the `bankstract` engine. Python 3.11+, `uv`, current engine pin `bankstract>=0.18.1` (`pyproject.toml`).

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
- Every engine call passes `isolate=True`, `timeout` and `memory_mb` (`Settings.isolate_*`, via `IsolationLimits`). The call runs in a child process the worker can kill, because a crafted PDF can cost gigabytes inside one mupdf call. Bytes cross to the child over a pipe, never a temp file (`tests/test_isolation.py` pins it).
- `ResourceLimitError` is not a `ParseError`. `_translate_engine_errors` maps it to a 422 with a fixed message, never a clean or partial result. The memory limit is 1024MB, not the engine's 2048: `parse_max_concurrent` children at 2048 would fill the box. It is enforced on Linux only.
- The engine's child re-imports `__main__`, so the entrypoint must be guarded (`uvicorn` is). The first isolated call after boot costs about 0.4s (it starts the helper), later ones about 0.07s.
- The worker MUST stay single-process (no uvicorn `--workers`). The job store is in memory.

## Async jobs

`POST /v1/parse/jobs` → SSE stream + poll fallback. `jobs.py` holds the in-memory `JobStore` (semaphore, capability lookup, TTL eviction); routes in `routes/parse.py`.

- The engine's `progress_callback` (throttled via `bankstract.throttle`) marshals events onto the job queue.
- The stream sees `done`, `reconcile`, `done` (two top-level engine calls). Only job state is terminal.
- A failed job reports the same detail as the sync error envelope: `error`, `error_class`, `format_version`, `marker_coverage`, on both the SSE `result` event and the poll snapshot (`_fail_job` stores them, `_sse_result` / `_snapshot` surface them). `tests/test_jobs.py` pins async == sync for each typed engine failure. Without `marker_coverage` a client cannot tell a legitimately empty statement from layout drift.
- The SSE stream takes no Authorization header: the unguessable `job_id` is the capability (EventSource cannot send headers). One consumer per job.
- The demo drives jobs through same-origin `/api/parse/jobs` proxies (`packages/demo/src/api/jobs.ts`) so `DEMO_API_KEY` stays server-side.

## Redaction

`POST /v1/redact` (`routes/redact.py`): `bankstract.redact(buf, bank=bank)` → `RedactResult(data, bank, format, format_version, report)`. It is sync only and shares the `state.jobs.semaphore` slots with parse and inspect. Return `result.data` with the matching Content-Type and `X-Bankstract-Redactions` / `X-Bankstract-Format-Version` headers.

## Storage

SQLite (`audit.sqlite`), raw `sqlite3`, no ORM. Schema changes are hand-written Alembic migrations in `migrations/` (see its README). They run at boot.
