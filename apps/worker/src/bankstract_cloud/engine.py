# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import io
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


class UnsupportedStatementError(Exception):
    """No registered parser matched the source, or the layout drifted. Maps to HTTP 422."""

    def __init__(self, message: str, *, error_class: str) -> None:
        super().__init__(message)
        self.error_class = error_class


class EngineError(Exception):
    """Unexpected engine error. Maps to HTTP 500. format_version is best-effort."""

    def __init__(self, message: str, *, error_class: str) -> None:
        super().__init__(message)
        self.error_class = error_class


@dataclass(frozen=True)
class ParseOutcome:
    response: ParseResponse
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


def list_supported_redactors() -> list[str]:
    return list(bankstract.list_redactors())


def parse_pdf(data: bytes, *, bank: str | None = None) -> ParseOutcome:
    """Parse PDF bytes entirely in memory. Directive 2 — bytes never touch disk.

    The BytesIO buffer is the only home for the PDF; it is released when this
    function returns and the caller drops the reference.
    """
    buf = io.BytesIO(data)
    detected = _detect(buf)
    buf.seek(0)
    try:
        result = bankstract.parse(buf, bank=bank)
    except ParseError as exc:
        raise UnsupportedStatementError(str(exc), error_class="ParseError") from exc
    except ReconciliationError as exc:
        # Structurally parsed but the balance check failed — the result is not
        # trustworthy, so we refuse it rather than return suspect numbers.
        raise UnsupportedStatementError(str(exc), error_class="ReconciliationError") from exc
    except Exception as exc:  # translate any engine error to a typed failure
        raise EngineError(str(exc), error_class=type(exc).__name__) from exc

    return ParseOutcome(response=_to_response(result), parser_detected=detected)


def redact_pdf(data: bytes, *, bank: str | None = None) -> RedactOutcome:
    """Redact a statement in memory and return the redacted document bytes.

    Directive 1/2 — bankstract.redact() operates on the BytesIO and returns bytes
    in-memory (engine guarantees no tempfile). The worker streams them straight to
    the HTTP response; nothing is written to disk and no payload is logged.
    """
    buf = io.BytesIO(data)
    try:
        result = bankstract.redact(buf, bank=bank)
    except ParseError as exc:
        raise UnsupportedStatementError(str(exc), error_class="ParseError") from exc
    except ReconciliationError as exc:
        raise UnsupportedStatementError(str(exc), error_class="ReconciliationError") from exc
    except Exception as exc:  # translate any engine error to a typed failure
        raise EngineError(str(exc), error_class=type(exc).__name__) from exc

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
