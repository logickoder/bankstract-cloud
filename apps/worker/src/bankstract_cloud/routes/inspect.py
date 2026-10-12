# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from ..auth import AuthContext
from ..engine import EngineError, UnsupportedStatementError, inspect_statement
from ..models import ErrorResponse, IntegrityReportOut
from ..state import AppState, get_state, require_auth
from .admission import ServeSample, admit_upload, audit_request, fail_response, free_cap_refusal

router = APIRouter(tags=["Inspect"])

_ENDPOINT = "inspect"
_UNREADABLE = "unparseable"
_UNREADABLE_REPORT = EngineError(
    "Engine returned a report the API could not read. This is a bug on our side. "
    "Try again, then report it.",
    error_class="ReportShapeError",
)


@router.post(
    "/v1/inspect",
    response_model=IntegrityReportOut,
    responses={
        401: {"model": ErrorResponse},
        402: {"model": ErrorResponse},
        403: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
    summary="Check a statement for tamper signals",
    description=(
        "Upload a statement and get evidence about whether the file was edited: reconciliation, "
        "revisions, producer, fonts, overlays drawn over text, and date order. This is evidence, "
        "never a verdict. A forger who regenerates the file with the bank's own library and "
        "recomputes every balance passes every check. `clean` means no signals; a `checks_skipped` "
        "warning means a check could not run on part of the file. HTTP 200 with error signals is a "
        "normal outcome. Counts as one parse for your plan. The file is read in memory and never "
        "written to disk."
    ),
)
async def inspect(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext = Depends(require_auth),
    bank: str | None = Form(default=None),
    state: AppState = Depends(get_state),
) -> IntegrityReportOut | JSONResponse:
    if ctx.is_anonymous:
        raise HTTPException(
            status_code=403,
            detail=(
                "Inspect is not available on the demo. The demo key is anonymous and capped. "
                "Use your own API key."
            ),
        )

    admitted = await admit_upload(request, pdf, ctx, state, None)
    if isinstance(admitted, ServeSample):
        # No canned inspect result: a made-up "clean" report would read as a real pass, which is the
        # one thing inspect must never do. Refuse, like redact.
        return free_cap_refusal(state, ctx, pdf.filename, _ENDPOINT)
    if isinstance(admitted, JSONResponse):
        return admitted
    data, byte_count = admitted

    try:
        async with state.jobs.semaphore:
            report = await asyncio.to_thread(
                inspect_statement, data, bank=bank, limits=state.isolation
            )
        # The wire model validates the engine's own dict, so a field the engine adds that the model
        # lacks fails the round-trip test instead of being copied (or dropped) by hand here. It runs
        # before the audit write: a report the API cannot serialize must not count as a parse.
        wire = IntegrityReportOut.model_validate(report.to_dict())
    except (UnsupportedStatementError, EngineError) as exc:
        return fail_response(state, ctx, pdf.filename, byte_count, exc, _ENDPOINT)
    except ValidationError:
        # Fixed message: pydantic's own text quotes the offending value, which is statement text.
        return fail_response(state, ctx, pdf.filename, byte_count, _UNREADABLE_REPORT, _ENDPOINT)
    finally:
        # The tuple also holds the bytes, so drop both references (Directive 1).
        del data, admitted

    # The engine reports a file its parser rejected as an `unparseable` error signal, not an
    # exception. That is a 200 for the caller, but not a parse we count or bill: "if the engine
    # cannot read it, you do not pay". Metadata only: never the signals, their codes, or detail.
    unreadable = any(signal.code == _UNREADABLE for signal in wire.signals)
    audit_request(
        state,
        ctx,
        pdf.filename,
        byte_count,
        wire.bank,
        not unreadable,
        _UNREADABLE if unreadable else None,
        _ENDPOINT,
    )
    return wire
