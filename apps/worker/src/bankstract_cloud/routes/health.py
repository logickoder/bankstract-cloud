# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..engine import list_supported_banks
from ..models import HealthResponse, ReadyResponse
from ..state import AppState, get_state

router = APIRouter(tags=["Health"])


@router.get(
    "/healthz",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Returns 200 once the process is up. No auth, no dependencies checked.",
)
async def healthz() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get(
    "/readyz",
    response_model=ReadyResponse,
    summary="Readiness probe",
    description="Reports whether the audit DB and the parsing engine are reachable. "
    "`degraded` means one is down and the worker should not take traffic.",
)
async def readyz(state: AppState = Depends(get_state)) -> ReadyResponse:
    db_ok = True
    try:
        state.audit.count_success_for_key("__probe__", since_iso="1970-01-01T00:00:00+00:00")
    except Exception:
        db_ok = False
    engine_ok = bool(list_supported_banks())
    healthy = db_ok and engine_ok
    return ReadyResponse(status="ok" if healthy else "degraded", engine=engine_ok, database=db_ok)
