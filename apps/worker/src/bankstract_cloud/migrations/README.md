# Worker migrations (Alembic, no ORM)

Schema for the worker SQLite DB lives here. We use Alembic for ordered, reversible migrations
but **no ORM**: every migration is hand-written with `op.execute(...)` / `op.create_table(...)`.
There is no `target_metadata`, so `alembic revision --autogenerate` does nothing useful. Write
the `upgrade()`/`downgrade()` bodies yourself.

## How it runs

The worker calls `db.run_migrations(audit_db_path)` at boot (`upgrade head`), which is idempotent:
it builds a fresh DB from the baseline and applies only new revisions on an existing one. Tests
get this for free (the app lifespan runs on `TestClient` startup against a tmp DB), so there is a
single schema path shared by app, tests, and deploy.

## Adding a migration

```bash
cd apps/worker
uv run alembic revision -m "add foo to api_keys"   # creates versions/<id>_add_foo...py
# edit upgrade()/downgrade() by hand
uv run alembic upgrade head                          # apply to the configured DB
uv run alembic downgrade -1                           # roll back one
```

## SQLite rule: batch mode for ALTER

SQLite can't drop/rename/retype a column in place. For anything beyond `ADD COLUMN`, wrap it:

```python
with op.batch_alter_table("api_keys") as batch:
    batch.drop_column("legacy")
```

`env.py` already sets `render_as_batch=True`.

## Existing dev DBs

A DB created before Alembic (or whose first stamp half-completed) has the full schema but no
recorded revision. `db._bridge_unversioned` handles this automatically at boot: when the whole
baseline schema is present but unversioned, it stamps `0001_baseline` instead of re-creating the
tables. A fresh or PARTIAL DB is left alone, so `upgrade head` either builds it or fails loudly
on an ambiguous half-schema (delete it and let it rebuild, pre-launch).
