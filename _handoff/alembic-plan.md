# Plan — Alembic migrations for the worker (no ORM)

Status: DRAFT for owner approval. Planning only.

## Why

`apps/worker/src/bankstract_cloud/db.py` creates schema with `CREATE TABLE IF NOT EXISTS`
in `_SCHEMA` and bridges new columns with a hand-rolled `_migrate()` (its own comment:
"post-launch real migrations move to Alembic"). That pattern breaks the moment there is prod
data + a non-trivial change (SQLite can't `ALTER` columns freely; ordering/rollback unmanaged).
We keep raw SQL (no ORM, per the worker-stack decision) but adopt Alembic for **versioned,
ordered, reversible** migrations. Pre-launch (zero prod data) is the free window.

Current tables (the baseline): `api_keys`, `audit_log`, `rate_limit`, `subscriptions`,
`webhook_events` (+ their indexes).

## Shape (Alembic without ORM)

- `target_metadata = None`. No autogenerate (that needs SQLAlchemy models). Migrations are
  **hand-written** with `op.create_table` / `op.add_column` / `op.create_index` / `op.execute`.
- SQLite needs **batch mode** for most `ALTER`s: `render_as_batch=True` in `env.py`, and use
  `with op.batch_alter_table(...)` in any column-altering migration. Document this as the rule.
- Alembic's `alembic_version` table lives in the same SQLite file. Harmless, metadata-only.

## Files

- `apps/worker/alembic.ini` — minimal; `script_location = migrations`. No hardcoded URL (env.py
  supplies it from Settings).
- `apps/worker/migrations/env.py` — reads `get_settings().audit_db_path`, builds the SQLite URL,
  configures `render_as_batch=True`, `target_metadata=None`. Online mode only (we never need
  offline SQL generation for SQLite here).
- `apps/worker/migrations/versions/0001_baseline.py` — `upgrade()` creates all 5 current tables
  + indexes (translate `db.py:_SCHEMA` verbatim into `op.create_table`/`op.create_index`).
  `downgrade()` drops them. This is the schema floor; everything new is a later revision.
- `apps/worker/migrations/README.md` — the workflow + the SQLite batch-mode rule + "manual
  migrations, no autogenerate".

## Wiring (single code path for app + tests)

- Add a `run_migrations(db_path: str) -> None` helper (programmatic Alembic:
  `command.upgrade(Config(...), "head")`, script_location resolved relative to the package).
- **`lifespan` calls `run_migrations(settings.audit_db_path)`** instead of `init_schema`.
  `upgrade head` is idempotent + fast; on a fresh DB it builds everything, on an existing one it
  applies only new revisions. Tests spin the app via `TestClient` → lifespan → migrations run on
  the tmp DB automatically, so **conftest needs no change** and there is ONE schema path (no
  init_schema/Alembic drift).
- Keep `db.py:connect()` (the connection + PRAGMAs). Delete `_SCHEMA`, `_migrate`, `init_schema`.
- Existing dev DBs (schema present, no `alembic_version`): one-time `alembic stamp 0001_baseline`
  to mark them at the floor without re-creating. Fresh DBs just `upgrade head`. Pre-launch, the
  simplest path is to delete dev DBs and let `upgrade head` build them clean.

## Dependency

- `uv add alembic` (runtime dep — `upgrade head` runs at worker boot). Pulls SQLAlchemy as a
  transitive dep; we use only Alembic's `op`/`command`, NOT the ORM. Note in pyproject why.

## Decision needed

- D-A1: run migrations in **lifespan** (recommended: one path, tests parity, single-box simple)
  vs a **deploy entrypoint** (`alembic upgrade head && uvicorn ...` in the container) that keeps
  app boot free of migration logic. Lifespan is simplest now; can move to an entrypoint later
  without touching migration files. Recommend lifespan.

## Slices

1. Add dep + `alembic.ini` + `env.py` + `0001_baseline` + `run_migrations` helper. Swap lifespan
   `init_schema` -> `run_migrations`. Delete db.py schema/migrate. Full worker test suite must
   stay green (proves the baseline migration reproduces the current schema exactly).
2. (later, as needed) Any real schema change ships as a new `op.*` revision in batch mode.

## Directive check

- Directive 1: migrations define metadata-only tables; no PDF payload columns introduced. The
  `0001_baseline` is a 1:1 of today's privacy-audited schema.
- Self-host bundle: Alembic + migrations ship in the worker image; `upgrade head` runs on the
  self-hoster's box too, so the AGPL self-host stays self-contained.
