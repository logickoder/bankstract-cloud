# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""Admission and audit shared by the routes that take a customer upload: /v1/parse, /v1/redact and
/v1/inspect.

One place for the charter ordering (size, human check, subscription gate, free cap, then read), so
a new upload route cannot drift from it.
"""

from __future__ import annotations

from fastapi import HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from ..audit import AuditEntry, Endpoint, current_period_start_iso
from ..auth import AuthContext
from ..engine import EngineError, UnsupportedStatementError
from ..responses import error_response
from ..state import AppState, client_ip, demo_bucket, first_party_bucket
from ..turnstile import verify_turnstile

FREE_LIMIT_CLASS = "free_limit_reached"


class ServeSample:
    """Admission verdict: the caller is over a free cap, so the engine does not run. The route
    decides what that means: parse serves its canned sample, a route with no meaningful sample
    (redact, inspect) refuses with free_cap_refusal. Distinct from a JSONResponse so callers can
    branch."""


SERVE_SAMPLE = ServeSample()


async def admit_upload(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext,
    state: AppState,
    turnstile_token: str | None,
) -> tuple[bytes, int] | JSONResponse | ServeSample:
    """Shared admission for every route that takes a customer upload. Enforces the charter ordering:
    the size limit, the human check (anonymous), the subscription gate (live), and the free-tier cap
    are all verified BEFORE the PDF is read, so an over-cap or inactive caller never moves payload.
    Returns (data, byte_count); the 402 envelope when a live subscription is inactive; or
    SERVE_SAMPLE when a free surface (demo per-IP, first-party per-IP, test per-owner) is over its
    cap."""
    max_bytes = state.settings.max_upload_bytes
    _enforce_size_header(request, max_bytes)

    if ctx.is_anonymous:
        # Turnstile is a hard human check (401); being over the per-IP budget is not an error, it
        # serves the canned sample.
        await _verify_turnstile(request, state, turnstile_token)
        if not _free_rate_ok(state, demo_bucket(request, state.settings.rate_limit_ip_salt)):
            return SERVE_SAMPLE

    # First-party surfaces parse free of billing but stay per-end-user-IP bounded, so a popular
    # surface cannot eat the box. Their proxy runs its own Turnstile and forwards the end-user
    # IP (trust model + missing-header degradation: see first_party_bucket).
    if ctx.is_first_party and not _free_rate_ok(
        state, first_party_bucket(request, state.settings.rate_limit_ip_salt, ctx.api_key_id)
    ):
        return SERVE_SAMPLE

    # Live keys parse only under an active subscription (charter §5).
    if ctx.is_billable and not (ctx.owner and state.subscriptions.is_active(ctx.owner)):
        return error_response(402, "subscription inactive", "subscription_inactive")

    # Test keys parse free up to the monthly cap, then get ServeSample. Counted success-only
    # (failed parses never burn quota) per OWNER for the current calendar month, so regenerating the
    # test key does not reset the count.
    if ctx.tier == "test" and _test_over_cap(state, ctx):
        return SERVE_SAMPLE

    data = await pdf.read()
    byte_count = len(data)
    if byte_count > max_bytes:
        raise HTTPException(status_code=413, detail="file too large")
    return data, byte_count


async def _verify_turnstile(request: Request, state: AppState, turnstile_token: str | None) -> None:
    ok = await verify_turnstile(
        turnstile_token or "",
        secret=state.settings.turnstile_secret_key,
        remote_ip=client_ip(request),
    )
    if not ok:
        raise HTTPException(status_code=401, detail="Turnstile verification failed")


def _free_rate_ok(state: AppState, bucket: str) -> bool:
    # One free per-IP budget product-wide (PRD § Pricing: one anonymous-consumer number): the
    # demo and first-party surfaces share these numbers in separately namespaced buckets. Split
    # into per-surface settings only if a surface ever earns a different budget.
    settings = state.settings
    return state.rate_limiter.check(
        bucket,
        max_count=settings.demo_rate_limit_max,
        window_seconds=settings.demo_rate_limit_window_seconds,
    )


def _test_over_cap(state: AppState, ctx: AuthContext) -> bool:
    since = current_period_start_iso()
    if ctx.owner:
        # Owner-scoped: sums every test key the owner has had this cycle, so rolling the key (a new
        # key id) cannot reset the count.
        used = state.audit.count_success_for_owner_tier(ctx.owner, "test", since_iso=since)
    else:
        # Ownerless test key (internal only; the dashboard always assigns an owner). Fall back to
        # per-key so it is still bounded.
        used = state.audit.count_success_for_key(ctx.api_key_id, since_iso=since)
    return used >= state.settings.test_tier_monthly_cap


def _enforce_size_header(request: Request, max_bytes: int) -> None:
    raw = request.headers.get("content-length")
    if raw and raw.isdigit() and int(raw) > max_bytes:
        raise HTTPException(status_code=413, detail="file too large")


async def admit_without_sample(
    request: Request,
    pdf: UploadFile,
    ctx: AuthContext,
    state: AppState,
    turnstile_token: str | None,
    endpoint: Endpoint,
) -> tuple[bytes, int] | JSONResponse:
    """admit_upload for a route with no canned sample (redact, inspect): over a free cap the caller
    is refused with the 402 instead of being handed a ServeSample to convert."""
    admitted = await admit_upload(request, pdf, ctx, state, turnstile_token)
    if isinstance(admitted, ServeSample):
        return free_cap_refusal(state, ctx, pdf.filename, endpoint)
    return admitted


def audit_request(
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
    byte_count: int,
    parser_detected: str | None,
    success: bool,
    error_class: str | None,
    endpoint: Endpoint = "parse",
) -> None:
    state.audit.record(
        AuditEntry(
            api_key_id=ctx.api_key_id,
            filename=filename,
            byte_count=byte_count,
            parser_detected=parser_detected,
            success=success,
            error_class=error_class,
            endpoint=endpoint,
        )
    )


def audit_free_cap(
    state: AppState, ctx: AuthContext, filename: str | None, endpoint: Endpoint = "parse"
) -> None:
    """Audit a request that was sampled or refused because the caller is over a free cap. Success is
    False, so it is funnel-visible and never counts toward the cap."""
    audit_request(state, ctx, filename, 0, None, False, FREE_LIMIT_CLASS, endpoint)


def free_cap_refusal(
    state: AppState, ctx: AuthContext, filename: str | None, endpoint: Endpoint = "parse"
) -> JSONResponse:
    """The 402 for a route with no meaningful canned sample (redact, inspect). A made-up result
    would read as a real one, so the caller is refused instead."""
    audit_free_cap(state, ctx, filename, endpoint)
    return error_response(402, "free tier limit reached", FREE_LIMIT_CLASS)


def fail_response(
    state: AppState,
    ctx: AuthContext,
    filename: str | None,
    byte_count: int,
    exc: UnsupportedStatementError | EngineError,
    endpoint: Endpoint = "parse",
) -> JSONResponse:
    """Audit an engine failure and build its envelope: 422 for a statement the engine refused
    (error_class carries the specific failure; marker_coverage rides along for EmptyStatementError),
    500 for an unexpected engine error."""
    audit_request(state, ctx, filename, byte_count, exc.bank, False, exc.error_class, endpoint)
    if isinstance(exc, UnsupportedStatementError):
        return error_response(
            422,
            str(exc),
            exc.error_class,
            format_version=exc.format_version,
            marker_coverage=exc.marker_coverage,
        )
    return error_response(500, str(exc), exc.error_class, format_version=exc.format_version)
