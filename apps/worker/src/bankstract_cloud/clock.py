# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from datetime import UTC, datetime


def utcnow_iso() -> str:
    """Current UTC instant, ISO-8601. The single now() for timestamped rows so every table
    stamps time the same way."""
    return datetime.now(UTC).isoformat()
