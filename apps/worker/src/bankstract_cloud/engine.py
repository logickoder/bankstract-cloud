# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import io
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass

import bankstract
from bankstract import ParseError, ProgressCallback, ReconciliationError

ENGINE_VERSION: str = getattr(bankstract, "__version__", "unknown")


class MappedEngineError(Exception):
    """An engine exception translated to a known HTTP outcome. Carries the fields
    the error envelope surfaces (error_class, format_version, marker_coverage) plus the
    matched parser for the audit log (engine ParseError.bank; None when detection failed)."""

    def __init__(
        self,
        message: str,
        *,
        error_class: str,
        format_version: str | None = None,
        marker_coverage: float | None = None,
        bank: str | None = None,
    ) -> None:
        super().__init__(message)
        self.error_class = error_class
        self.format_version = format_version
        self.marker_coverage = marker_coverage
        self.bank = bank


class UnsupportedStatementError(MappedEngineError):
    """No registered parser/redactor matched, or the layout drifted. Maps to HTTP 422."""


class EngineError(MappedEngineError):
    """Unexpected engine error. Maps to HTTP 500. format_version is best-effort."""


@contextmanager
def _translate_engine_errors() -> Generator[None, None, None]:
    try:
        yield
    except ReconciliationError as exc:
        # Parsed but the balance check failed. Refuse rather than return suspect numbers.
        raise UnsupportedStatementError(
            str(exc),
            error_class="ReconciliationError",
            format_version=exc.format_version,
            bank=exc.bank,
        ) from exc
    except ParseError as exc:
        # ParseError is the base. type(exc).__name__ surfaces the specific subclass the engine
        # raised (EncryptedSourceError, EmptyStatementError, LayoutDriftError). Engine 0.14 raises
        # EncryptedSourceError on the auto-detect path too, so no worker-side reclassification of
        # encrypted uploads is needed. marker_coverage rides along when present.
        raise UnsupportedStatementError(
            str(exc),
            error_class=type(exc).__name__,
            format_version=exc.format_version,
            marker_coverage=getattr(exc, "marker_coverage", None),
            bank=exc.bank,
        ) from exc
    except MappedEngineError:
        raise
    except Exception as exc:  # translate any other engine error to a typed failure
        raise EngineError(str(exc), error_class=type(exc).__name__) from exc


@dataclass(frozen=True)
class ParseOutcome:
    """Engine-serialized statement (JSON or CSV bytes). Holds transaction data: it leaves only in
    the HTTP response and is never logged or persisted."""

    data: bytes
    parser_detected: str | None


@dataclass(frozen=True)
class RedactOutcome:
    data: bytes
    media_type: str
    bank: str
    format_version: str
    redactions: int


_MEDIA_TYPES: dict[str, str] = {
    "pdf": "application/pdf",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


def media_type_for(fmt: str) -> str:
    media = _MEDIA_TYPES.get(fmt)
    if media is None:
        raise EngineError(
            f"engine returned unknown redact format {fmt!r}", error_class="UnknownFormat"
        )
    return media


def list_supported_banks() -> list[str]:
    return list(bankstract.list_parsers())


def parse_statement(
    data: bytes,
    *,
    fmt: bankstract.OutputFormat,
    bank: str | None = None,
    progress_callback: ProgressCallback | None = None,
) -> ParseOutcome:
    """Parse, reconcile, and serialize a statement entirely in memory (Directive 2).

    One path for both formats. parse() does not reconcile (the engine leaves that to the caller);
    reconcile_result() runs the totals + row-wise checks and raises ReconciliationError (a 422)
    on a failed check or when neither can run. serialize() emits the same bytes convert() and the
    CLI do, so the /v1 wire shape is the pinned engine version's: an engine shape change reaches
    clients only when the pin moves. Progress sees `done`, `reconcile`, `done` (two top-level
    engine calls); only job state is terminal.
    """
    with _translate_engine_errors():
        result = bankstract.reconcile_result(
            bankstract.parse(io.BytesIO(data), bank=bank, progress_callback=progress_callback),
            progress_callback=progress_callback,
        )
        return ParseOutcome(data=bankstract.serialize(result, fmt), parser_detected=result.bank)


def redact_pdf(
    data: bytes,
    *,
    bank: str | None = None,
    progress_callback: ProgressCallback | None = None,
) -> RedactOutcome:
    """Redact a statement in memory and return the redacted document bytes.

    Directive 1/2: bankstract.redact() operates on the BytesIO and returns bytes
    in-memory (engine guarantees no tempfile). The worker streams them straight to
    the HTTP response; nothing is written to disk and no payload is logged.
    """
    buf = io.BytesIO(data)
    with _translate_engine_errors():
        result = bankstract.redact(buf, bank=bank, progress_callback=progress_callback)

    return RedactOutcome(
        data=result.data,
        media_type=media_type_for(result.format),
        bank=result.bank,
        format_version=result.format_version,
        redactions=result.report.redactions,
    )
