# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio
import hmac
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Literal

from fastapi import HTTPException

JobState = Literal["queued", "running", "done", "failed"]
ResultKind = Literal["json", "csv", "redact"]

# Stage marker enqueued once a job reaches a terminal state, so a stream consumer knows to stop
# draining and emit the final result event.
TERMINAL_STAGE = "terminal"


@dataclass
class Job:
    """An in-flight async parse. Lives in memory only (Directive 1): the upload bytes are dropped
    when the worker thread finishes, and `result` (which holds parsed transactions) is cleared when
    the job is swept past its TTL. Nothing here is written to disk, a DB, or a log."""

    id: str
    owner_key: str  # the submitter's api_key_id; a secondary guard behind the capability job_id
    filename: str | None
    byte_count: int
    is_anonymous: bool = False  # demo tier: json/csv results are watermarked at serve time
    is_sample: bool = False  # over a free cap: serve a canned sample, engine never ran, result=None
    queue: asyncio.Queue[dict[str, Any]] = field(
        default_factory=lambda: asyncio.Queue[dict[str, Any]]()
    )
    state: JobState = "queued"
    result: Any = None  # ParseOutcome | CsvOutcome | RedactOutcome while alive; None once swept
    result_kind: ResultKind = "json"
    media_type: str | None = None  # Content-Type for a bytes result (csv/redact); None for json
    redactions: int | None = None  # redact only
    last_event: dict[str, Any] | None = None
    error_class: str | None = None
    error_message: str | None = None
    format_version: str | None = None
    marker_coverage: float | None = None
    terminal_at: float | None = None  # monotonic seconds the job reached a terminal state
    task: asyncio.Task[None] | None = None  # strong ref to the runner so the loop never GCs it


class JobStore:
    """In-memory job registry with a concurrency cap and TTL eviction. Single-process only: the
    worker must run one uvicorn process (no --workers) or job lookups miss across processes."""

    def __init__(self, *, max_concurrent: int, ttl_seconds: int) -> None:
        self._jobs: dict[str, Job] = {}
        self._sem = asyncio.Semaphore(max_concurrent)
        self._ttl = ttl_seconds

    @property
    def semaphore(self) -> asyncio.Semaphore:
        return self._sem

    def create(
        self,
        *,
        owner_key: str,
        filename: str | None,
        byte_count: int,
        is_anonymous: bool = False,
        is_sample: bool = False,
    ) -> Job:
        job = Job(
            id=uuid.uuid4().hex,
            owner_key=owner_key,
            filename=filename,
            byte_count=byte_count,
            is_anonymous=is_anonymous,
            is_sample=is_sample,
        )
        self._jobs[job.id] = job
        return job

    def get_or_404(self, job_id: str, *, owner_key: str | None) -> Job:
        # The unguessable job_id is the capability. owner_key is checked only when the caller is
        # authenticated (the poll endpoint); the stream passes None because EventSource cannot send
        # an Authorization header. A wrong owner gets 404, not 403, so existence is never confirmed.
        job = self._jobs.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="job not found")
        if owner_key is not None and not hmac.compare_digest(job.owner_key, owner_key):
            raise HTTPException(status_code=404, detail="job not found")
        return job

    def sweep(self) -> int:
        """Evict terminal jobs older than the TTL, clearing their result so parsed transactions
        do not linger in RAM. Returns the count evicted. Called periodically by the sweeper."""
        now = time.monotonic()
        expired = [
            jid
            for jid, job in self._jobs.items()
            if job.terminal_at is not None and now - job.terminal_at > self._ttl
        ]
        for jid in expired:
            job = self._jobs.pop(jid, None)
            if job is not None:
                job.result = None
        return len(expired)
