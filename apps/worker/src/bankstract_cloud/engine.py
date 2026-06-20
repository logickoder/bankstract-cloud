# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import io
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass

import bankstract
from bankstract import ParseError, ReconciliationError

from .models import (
    ParseResponse,
    StatementMetadataOut,
    TotalsOut,
    TransactionOut,
)

ENGINE_VERSION: str = getattr(bankstract, "__version__", "unknown")


class MappedEngineError(Exception):
    """An engine exception translated to a known HTTP outcome. Carries the fields
    the error envelope surfaces: error_class, format_version, marker_coverage."""

    def __init__(
        self,
        message: str,
        *,
        error_class: str,
        format_version: str | None = None,
        marker_coverage: float | None = None,
    ) -> None:
        super().__init__(message)
        self.error_class = error_class
        self.format_version = format_version
        self.marker_coverage = marker_coverage


class UnsupportedStatementError(MappedEngineError):
    """No registered parser/redactor matched, or the layout drifted. Maps to HTTP 422."""


class EngineError(MappedEngineError):
    """Unexpected engine error. Maps to HTTP 500. format_version is best-effort."""


def _looks_encrypted(data: bytes) -> bool:
    """Heuristic encryption check from the raw bytes.

    The engine raises EncryptedSourceError only once a parser opens the document.
    On auto-detect it can't read the encrypted text to pick a bank, so an encrypted
    upload surfaces as the generic "no parser detected". We recognise encryption here
    so the client can show the password-removal path instead of a generic error.
    """
    if data[:5] == b"%PDF-" and b"/Encrypt" in data:
        return True
    # Encrypted OOXML (xlsx) is wrapped in an OLE/CFB container, not a zip.
    return data[:4] == b"\xd0\xcf\x11\xe0"


@contextmanager
def _translate_engine_errors(source: bytes | None = None) -> Generator[None, None, None]:
    try:
        yield
    except ReconciliationError as exc:
        # Parsed but the balance check failed. Refuse rather than return suspect numbers.
        raise UnsupportedStatementError(
            str(exc),
            error_class="ReconciliationError",
            format_version=getattr(exc, "format_version", None),
        ) from exc
    except ParseError as exc:
        # ParseError is the base. type(exc).__name__ surfaces the specific subclass
        # the engine raised (EncryptedSourceError, EmptyStatementError, LayoutDriftError
        # in 0.13+) without a hard import. marker_coverage rides along when present.
        error_class = type(exc).__name__
        # Upgrade a bare "no parser detected" to EncryptedSourceError when the bytes are
        # encrypted. On 0.13 the engine can't detect a bank from locked text so it gives
        # up generically. Engine 0.14 raises EncryptedSourceError during auto-detect, after
        # which this branch no-ops (error_class is already specific). Kept as a fallback.
        if error_class == "ParseError" and source is not None and _looks_encrypted(source):
            error_class = "EncryptedSourceError"
        raise UnsupportedStatementError(
            str(exc),
            error_class=error_class,
            format_version=getattr(exc, "format_version", None),
            marker_coverage=getattr(exc, "marker_coverage", None),
        ) from exc
    except MappedEngineError:
        raise
    except Exception as exc:  # translate any other engine error to a typed failure
        raise EngineError(str(exc), error_class=type(exc).__name__) from exc


@dataclass(frozen=True)
class ParseOutcome:
    response: ParseResponse
    parser_detected: str | None


@dataclass(frozen=True)
class CsvOutcome:
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


def _buffer_and_detect(data: bytes) -> tuple[io.BytesIO, str | None]:
    """Wrap bytes in the single in-memory buffer (Directive 2) and advisory-detect the
    bank. The buffer is rewound so the caller can hand it to the engine."""
    buf = io.BytesIO(data)
    detected = _detect(buf)
    buf.seek(0)
    return buf, detected


def parse_pdf(data: bytes, *, bank: str | None = None) -> ParseOutcome:
    """Parse PDF bytes entirely in memory. Directive 2: bytes never touch disk."""
    buf, detected = _buffer_and_detect(data)
    with _translate_engine_errors(source=data):
        result = bankstract.parse(buf, bank=bank)
    return ParseOutcome(response=_to_response(result), parser_detected=detected)


def parse_csv(data: bytes, *, bank: str | None = None) -> CsvOutcome:
    """Parse and serialize to CSV in one engine call.

    bankstract.parse_to() parses and writes the chosen format in-memory and returns
    bytes (no tempfile, Directive 2). The CSV holds transaction data, so it leaves
    only in the HTTP response; it is never logged or persisted.
    """
    buf, detected = _buffer_and_detect(data)
    with _translate_engine_errors(source=data):
        csv_bytes = bankstract.parse_to(buf, format="csv", bank=bank)
    return CsvOutcome(data=csv_bytes, parser_detected=detected)


def redact_pdf(data: bytes, *, bank: str | None = None) -> RedactOutcome:
    """Redact a statement in memory and return the redacted document bytes.

    Directive 1/2: bankstract.redact() operates on the BytesIO and returns bytes
    in-memory (engine guarantees no tempfile). The worker streams them straight to
    the HTTP response; nothing is written to disk and no payload is logged.
    """
    # No _detect() here. RedactResult already carries the matched bank.
    buf = io.BytesIO(data)
    with _translate_engine_errors(source=data):
        result = bankstract.redact(buf, bank=bank)

    return RedactOutcome(
        data=result.data,
        media_type=media_type_for(result.format),
        bank=result.bank,
        format_version=result.format_version,
        redactions=result.report.redactions,
    )


def _detect(buf: io.BytesIO) -> str | None:
    try:
        return bankstract.detect(buf)
    except Exception:  # detection is advisory metadata only, never fatal
        return None


def _to_response(result: object) -> ParseResponse:
    metadata = getattr(result, "metadata", None)
    metadata_out = (
        StatementMetadataOut(
            bank=metadata.bank,
            account_holder=metadata.account_holder,
            account_number_masked=metadata.account_number_masked,
            statement_period_start=metadata.statement_period_start,
            statement_period_end=metadata.statement_period_end,
            opening_balance=metadata.opening_balance,
            closing_balance=metadata.closing_balance,
        )
        if metadata is not None
        else None
    )

    transactions = [
        TransactionOut(
            date=t.date,
            narration=t.narration,
            debit=t.debit,
            credit=t.credit,
            balance=t.balance,
            reference=t.reference,
            currency=t.currency,
        )
        for t in getattr(result, "transactions", [])
    ]

    return ParseResponse(
        format_version=getattr(result, "format_version", None),
        metadata=metadata_out,
        totals=TotalsOut(
            credit=getattr(result, "total_credit", None),
            debit=getattr(result, "total_debit", None),
        ),
        row_wise_reconcilable=bool(getattr(result, "row_wise_reconcilable", False)),
        transactions=transactions,
    )
