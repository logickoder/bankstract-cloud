# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from typing import TYPE_CHECKING

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from . import __version__

if TYPE_CHECKING:
    from sentry_sdk.types import Event, Hint

    from .config import Settings

# Directive 1 is the whole point of this module. Sentry's defaults would exfiltrate exactly the
# things we promise never to store: PDF bytes live in stack-frame locals (include_local_variables),
# the multipart upload body, the Authorization header (the API key), and the client IP. Every
# setting below exists to slam those shut. Touch them only if you understand which leak you reopen.


def init_sentry(settings: Settings) -> None:
    """Initialize Sentry error reporting, scrubbed for the privacy invariant. No-op when the DSN
    is unset (dev/test): no network, no reports (mirrors the Paystack-disabled pattern)."""
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.env,
        release=__version__,
        # PDF bytes and parsed transactions sit in frame locals on the parse path. Never ship them.
        include_local_variables=False,
        # No cookies, no Authorization header, no client IP.
        send_default_pii=False,
        # The request body IS the PDF. Never capture it.
        max_request_body_size="never",
        # Errors only. No transaction/perf payloads that could carry URLs or timing on user data.
        traces_sample_rate=0.0,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
        before_send=scrub_event,
    )


def scrub_event(event: Event, _hint: Hint) -> Event | None:
    # Belt-and-suspenders over the init flags: strip any request data/headers/cookies that a future
    # integration might still attach. The body and the API-key header must never leave the box.
    request = event.get("request")
    if isinstance(request, dict):
        for field in ("data", "headers", "cookies", "query_string"):
            request.pop(field, None)
    return event
