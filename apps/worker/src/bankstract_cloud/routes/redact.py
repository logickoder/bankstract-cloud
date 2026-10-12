# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio
from typing import Any

from fastapi import APIRouter, Depends, Form, Request, Response, UploadFile
from fastapi.responses import JSONResponse

from ..audit import Endpoint
from ..auth import AuthContext
from ..engine import (
    REDACTED_MEDIA_TYPES,
    EngineError,
    UnsupportedStatementError,
    redact_pdf,
)
from ..models import ErrorResponse
from ..state import AppState, get_state, require_auth
from .admission import admit_without_sample, audit_request, fail_response

router = APIRouter(tags=["Redact"])

_ENDPOINT: Endpoint = "redact"

# Named once: the OpenAPI entry and the response must agree on them.
_REDACTIONS_HEADER = "X-Bankstract-Redactions"
_FORMAT_VERSION_HEADER = "X-Bankstract-Format-Version"


@router.post(
    "/v1/redact",
    response_model=None,
    response_class=Response,
    responses={
        200: {
            "description": "The redacted document, in the format of the upload.",
            "content": {
                media_type: {"schema": {"type": "string", "format": "binary"}}
                for media_type in REDACTED_MEDIA_TYPES
            },
            "headers": {
                _REDACTIONS_HEADER: {
                    "description": "How many redactions were applied.",
                    "schema": {"type": "integer"},
                },
                _FORMAT_VERSION_HEADER: {
                    "description": "The statement layout version the redactor matched.",
                    "schema": {"type": "string"},
                },
            },
        },
        401: {"model": ErrorResponse},
        402: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Redact a bank statement",
    description=(
        "Upload a PDF (or XLSX) statement and get the same document back with names, account "
        "numbers and BVN masked in place. The response body is the redacted file. The file is "
        "read in memory and never written to disk. Counts as one parse for your plan. Over a "
        "free cap it returns 402: there is no canned sample for a redacted document. Sync only: "
        "a request holds one of the worker's engine slots for the length of the redaction."
    ),
)
async def redact(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext = Depends(require_auth),
    bank: str | None = Form(default=None),
    turnstile_token: str | None = Form(default=None),
    state: AppState = Depends(get_state),
) -> Response:
    admitted = await admit_without_sample(request, pdf, ctx, state, turnstile_token, _ENDPOINT)
    if isinstance(admitted, JSONResponse):
        return admitted
    data, byte_count = admitted

    try:
        async with state.jobs.semaphore:
            redacted = await asyncio.to_thread(redact_pdf, data, bank=bank, limits=state.isolation)
    except (UnsupportedStatementError, EngineError) as exc:
        return fail_response(state, ctx, pdf.filename, byte_count, exc, _ENDPOINT)
    finally:
        # The tuple also holds the bytes, so drop both references (Directive 1).
        del data, admitted

    audit_request(state, ctx, pdf.filename, byte_count, redacted.bank, True, None, _ENDPOINT)
    # Bytes stream straight out: no disk, no payload log.
    headers: dict[str, Any] = {
        _REDACTIONS_HEADER: str(redacted.redactions),
        _FORMAT_VERSION_HEADER: redacted.format_version,
    }
    return Response(content=redacted.data, media_type=redacted.media_type, headers=headers)
