# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from ..models import KeyCreatedResponse, KeyCreateRequest, KeyInfo, KeyListResponse
from ..responses import ADMIN_ERRORS
from ..state import AppState, get_state, require_admin

# The `bsk_` keys these mint can't reach here (require_admin, not require_auth): a key can
# never mint more keys.
router = APIRouter(tags=["Keys"])


@router.post(
    "/v1/keys",
    response_model=KeyCreatedResponse,
    status_code=201,
    responses=ADMIN_ERRORS,
    summary="Issue an API key",
    description="Admin-only. Returns the raw key exactly once; only its argon2 hash is stored.",
)
async def create_key(
    body: KeyCreateRequest,
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> KeyCreatedResponse:
    issued = state.keystore.issue(body.name, body.env, owner=body.owner)
    # The raw key is returned here and NOWHERE else. The DB only has its argon2 hash.
    return KeyCreatedResponse(
        id=issued.id,
        key=issued.raw_key,
        prefix=issued.lookup_prefix,
        name=body.name,
        env=body.env,
        tier=issued.tier,
    )


@router.get(
    "/v1/keys",
    response_model=KeyListResponse,
    responses=ADMIN_ERRORS,
    summary="List API keys",
    description="Admin-only. Lists key metadata (never the raw key) for an owner, including "
    "revoked keys for the audit trail.",
)
async def list_keys(
    owner: str | None = Query(default=None),
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> KeyListResponse:
    records = state.keystore.list_keys(owner=owner)
    return KeyListResponse(
        keys=[
            KeyInfo(
                id=r.id,
                name=r.name,
                prefix=r.lookup_prefix,
                env=r.env,
                tier=r.tier,
                owner=r.owner,
                created_at=r.created_at,
                revoked_at=r.revoked_at,
            )
            for r in records
        ]
    )


@router.delete(
    "/v1/keys/{key_id}",
    status_code=204,
    responses=ADMIN_ERRORS,
    summary="Revoke an API key",
    description="Admin-only. Marks the key revoked (never deletes it, for the audit trail). "
    "A revoked key stops parsing immediately.",
)
async def revoke_key(
    key_id: str,
    _: None = Depends(require_admin),
    state: AppState = Depends(get_state),
) -> Response:
    if not state.keystore.revoke(key_id):
        raise HTTPException(status_code=404, detail="key not found or already revoked")
    return Response(status_code=204)
