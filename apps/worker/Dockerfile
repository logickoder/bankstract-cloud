# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike
#
# Build context: apps/worker
FROM python:3.11-slim AS base

COPY --from=ghcr.io/astral-sh/uv:0.9.22 /uv /bin/uv

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Install deps first (cached layer), only re-runs when the lock changes.
COPY pyproject.toml uv.lock README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY src ./src
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH" \
    AUDIT_DB_PATH=/data/audit.sqlite \
    BANKSTRACT_CLOUD_ENV=production

# Audit DB (metadata-only) persists on a volume; nothing else is written to disk.
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8000

# Single process only (no --workers). The async parse-job store (jobs.py) is in-memory, so multiple
# workers would not share jobs and a stream/poll could land on a process that never saw the job.
CMD ["uvicorn", "bankstract_cloud.main:app", "--host", "0.0.0.0", "--port", "8000"]
