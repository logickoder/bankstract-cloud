# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from typing import Any

from fastapi.responses import JSONResponse

from .models import ErrorResponse

# Admin-gated endpoints share these documented error responses (401/403).
ADMIN_ERRORS: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse},
    403: {"model": ErrorResponse},
}

# Framework errors (auth, size, rate limit) are raised as HTTPException; this maps each
# status to a class so the handler can wrap them in the same ErrorResponse envelope as
# engine errors. Every non-2xx response shares one shape.
_STATUS_CLASS_MAP = {
    401: "AuthError",
    403: "PermissionError",
    413: "PayloadTooLarge",
    415: "UnsupportedMediaType",
    429: "RateLimitError",
    503: "ServiceUnavailable",
}


def class_for_status(status: int) -> str:
    return _STATUS_CLASS_MAP.get(status, "WorkerError")


def error_response(
    status: int,
    message: str,
    error_class: str,
    *,
    format_version: str | None = None,
    marker_coverage: float | None = None,
) -> JSONResponse:
    body = ErrorResponse(
        error=message,
        error_class=error_class,
        format_version=format_version,
        marker_coverage=marker_coverage,
    )
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"))
