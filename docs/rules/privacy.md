# Privacy

The load-bearing trust claim: we process in memory, we never write your PDF to disk, we never log file contents. Break it and the brand dies.

## PDF bytes never leave memory

- Flow: client → worker → `BytesIO` → `bankstract.parse` → `reconcile_result` → `serialize` → HTTP response → garbage collected.
- Never write PDF bytes to disk: no `open(..., 'wb')`, `Path.write_bytes`, `NamedTemporaryFile(delete=False)`, caching layers.
- `del` the bytes as soon as the engine call returns. Both the sync route and `_run_job` do this in `finally`.
- `bankstract.redact()` returns bytes in memory (engine tempfile-invariant test). Stream `result.data` straight to the response.
- Async job results live in RAM only until the TTL sweep. Never disk, DB, or log. Progress events carry `{stage, current, total}` only.

```python
# WRONG: writes to disk
with open("/tmp/in.pdf", "wb") as f:
    f.write(await pdf.read())
result = bankstract.parse(Path("/tmp/in.pdf"))
```

## Nothing from the statement is logged or stored

- Never log PDF contents, transactions, account holders, or balances.
- Never persist `transactions` or `metadata` to a database. Return them and let them die.
- The audit log is metadata only: `(id, timestamp, api_key_id_or_anonymous, filename, byte_count, parser_detected, success, error_class)`. No payload fields.
- "Transaction history" or "saved parses" requests: push back. That is a v1.5+ opt-in feature, never a default.

## No broker

The job store is in-process. Celery or any broker would push bytes off the box. See [worker](worker.md).
