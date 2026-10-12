# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

import logging
from typing import Any, get_args

import pytest
from bankstract import IntegrityReport, IntegritySignal, ResourceLimitError
from bankstract.integrity import Severity, SignalCode

from bankstract_cloud.models import IntegrityReportOut, IntegritySignalOut
from tests.conftest import (
    MAX_BYTES,
    Harness,
    audit_rows,
    auth_header,
    fake_parse,
    owner_test_key,
    pdf_upload,
)
from tests.fixtures import MINIMAL_PDF

# Synthetic detail text (fixture rule: FOO / ACME). It stands in for statement text the engine
# quotes, which must reach the caller and never a log or the audit row.
_DETAIL = "balance 1,111.00 does not follow FOO ACME TRANSFER"

_ERROR = IntegritySignal(
    code="reconciliation_failed", severity="error", detail=_DETAIL, page=2, row=4
)
_WARN = IntegritySignal(
    code="checks_skipped", severity="warn", detail="overlay check off on page 3", page=3
)


def _post(harness: Harness, key: str, data: bytes = MINIMAL_PDF, **form: str) -> Any:
    return harness.client.post(
        "/v1/inspect", files=pdf_upload(data), data=form or None, headers=auth_header(key)
    )


def _fake_inspect(
    monkeypatch: pytest.MonkeyPatch, *signals: IntegritySignal, bank: str | None = "fbn"
) -> list[dict[str, Any]]:
    calls: list[dict[str, Any]] = []

    def _impl(source: object, **kwargs: Any) -> IntegrityReport:
        calls.append(kwargs)
        return IntegrityReport(bank=bank, format_version="fbn-2026-01", signals=tuple(signals))

    monkeypatch.setattr("bankstract.inspect", _impl)
    return calls


def test_clean_report(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    _fake_inspect(monkeypatch)
    resp = _post(harness, owner_test_key(harness))

    assert resp.status_code == 200
    assert resp.json() == {
        "bank": "fbn",
        "format_version": "fbn-2026-01",
        "signals": [],
        "clean": True,
    }


def test_signals_reach_the_caller_with_their_detail(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    _fake_inspect(monkeypatch, _ERROR, _WARN)
    resp = _post(harness, owner_test_key(harness))

    # Evidence, not a verdict: the call worked, so error signals are still a 200.
    assert resp.status_code == 200
    body = resp.json()
    assert body["clean"] is False
    assert body["signals"][0] == {
        "code": "reconciliation_failed",
        "severity": "error",
        "detail": _DETAIL,
        "page": 2,
        "row": 4,
    }
    # A skipped check is a warning, not a pass: the report is not clean.
    assert body["signals"][1]["severity"] == "warn"
    assert body["signals"][1]["row"] is None


def test_bank_hint_reaches_the_engine_in_isolation(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls = _fake_inspect(monkeypatch)
    _post(harness, owner_test_key(harness), bank="zenith")

    assert calls[0]["bank"] == "zenith"
    assert calls[0]["isolate"] is True
    assert calls[0]["timeout"] > 0
    assert calls[0]["memory_mb"] > 0


def test_a_non_bank_file_is_an_error_signal_not_an_exception(harness: Harness) -> None:
    # Real engine, no fake: MINIMAL_PDF matches no bank. The engine reports `unparseable` as
    # evidence, so the worker returns it as a normal 200 report.
    resp = _post(harness, owner_test_key(harness))

    assert resp.status_code == 200
    body = resp.json()
    assert body["clean"] is False
    assert [s["code"] for s in body["signals"]] == ["unparseable"]
    assert body["signals"][0]["severity"] == "error"


def test_the_demo_key_can_inspect_and_gets_the_demo_envelope(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    _fake_inspect(monkeypatch, _ERROR)
    resp = _post(harness, harness.demo_key)

    assert resp.status_code == 200
    body = resp.json()
    # Additive: the report keys stay at the top level, like a demo parse.
    assert body["_demo"]["tier"] == "free_demo"
    assert body["clean"] is False
    assert body["signals"][0]["code"] == "reconciliation_failed"
    row = audit_rows(harness)[-1]
    assert (row["endpoint"], row["success"]) == ("inspect", 1)


def test_demo_inspect_shares_the_one_per_ip_budget(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # DEMO_RATE_LIMIT_MAX is 5 in the harness, one number across every route. Two parses and three
    # inspects spend it, so the next inspect is refused and the engine does not run for it.
    monkeypatch.setattr("bankstract.parse", fake_parse())
    calls = _fake_inspect(monkeypatch)
    demo = auth_header(harness.demo_key)
    for _ in range(2):
        assert harness.client.post("/v1/parse", files=pdf_upload(), headers=demo).status_code == 200
    for _ in range(3):
        assert _post(harness, harness.demo_key).status_code == 200

    over = _post(harness, harness.demo_key)
    # There is no canned inspect result: a made-up clean report would read as a real pass.
    assert over.status_code == 402
    assert over.json()["error_class"] == "free_limit_reached"
    assert len(calls) == 3


def test_demo_inspect_requires_the_turnstile_token(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    seen: list[str] = []

    async def _verify(token: str, **_: object) -> bool:
        seen.append(token)
        return token == "good"

    monkeypatch.setattr("bankstract_cloud.routes.admission.verify_turnstile", _verify)
    calls = _fake_inspect(monkeypatch)

    assert _post(harness, harness.demo_key).status_code == 401
    assert _post(harness, harness.demo_key, turnstile_token="good").status_code == 200
    assert seen == ["", "good"]
    assert len(calls) == 1


def test_missing_key_is_401(harness: Harness) -> None:
    resp = harness.client.post("/v1/inspect", files=pdf_upload())
    assert resp.status_code == 401


def test_oversize_upload_is_413(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    calls = _fake_inspect(monkeypatch)
    resp = _post(harness, owner_test_key(harness), b"%PDF-" + b"0" * (MAX_BYTES + 1))

    assert resp.status_code == 413
    assert calls == []


def test_inactive_live_key_is_402_and_never_reaches_the_engine(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls = _fake_inspect(monkeypatch)
    key = harness.client.app.state.app_state.keystore.issue("p", "live", owner="insp_live").raw_key  # pyright: ignore[reportUnknownMemberType]
    resp = _post(harness, key)

    assert resp.status_code == 402
    assert resp.json()["error_class"] == "subscription_inactive"
    assert calls == []


def test_an_active_live_key_inspects(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    _fake_inspect(monkeypatch)
    state = harness.client.app.state.app_state  # pyright: ignore[reportUnknownMemberType]
    key = state.keystore.issue("p", "live", owner="insp_paid").raw_key
    state.subscriptions.map_customer(owner="insp_paid", customer_code="CUS_insp")
    state.subscriptions.activate(
        customer_code="CUS_insp",
        subscription_code="SUB_insp",
        plan_code="PLN_starter_test",
        tier="starter",
        current_period_end=None,
    )

    assert _post(harness, key).status_code == 200


def test_inspect_counts_toward_the_free_cap_then_refuses_instead_of_faking_a_pass(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # TEST_TIER_MONTHLY_CAP is 3 in the harness. One inspect = one parse, so three succeed.
    calls = _fake_inspect(monkeypatch)
    key = owner_test_key(harness, "insp_cap")
    for _ in range(3):
        assert _post(harness, key).status_code == 200

    over = _post(harness, key)
    # Parse serves a canned sample over the cap. Inspect has none: a made-up "clean" report would
    # read as a real pass, so it refuses, and the engine does not run.
    assert over.status_code == 402
    assert over.json()["error_class"] == "free_limit_reached"
    assert len(calls) == 3


def test_a_resource_limit_is_a_422_and_audited_as_an_inspect_failure(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    def _limit(source: object, **_: Any) -> IntegrityReport:
        raise ResourceLimitError("worker died: /srv/app/secret_main.py")

    monkeypatch.setattr("bankstract.inspect", _limit)
    resp = _post(harness, owner_test_key(harness))

    assert resp.status_code == 422
    assert resp.json()["error_class"] == "ResourceLimitError"
    assert "secret_main" not in resp.text
    row = audit_rows(harness)[-1]
    assert (row["success"], row["error_class"], row["endpoint"]) == (
        0,
        "ResourceLimitError",
        "inspect",
    )


def test_the_audit_row_is_metadata_only(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    _fake_inspect(monkeypatch, _ERROR, _WARN)
    _post(harness, owner_test_key(harness))

    row = audit_rows(harness)[-1]
    assert (row["endpoint"], row["success"], row["parser_detected"]) == ("inspect", 1, "fbn")
    flat = " ".join(str(v) for v in tuple(row))
    # Neither the statement text nor the signal codes are persisted.
    assert _DETAIL not in flat
    assert "reconciliation_failed" not in flat
    assert "checks_skipped" not in flat


def test_signal_detail_is_never_logged(
    harness: Harness, monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    _fake_inspect(monkeypatch, _ERROR)
    with caplog.at_level(logging.DEBUG):
        _post(harness, owner_test_key(harness))

    assert _DETAIL not in caplog.text
    assert "1,111.00" not in caplog.text


def test_parse_rows_stay_endpoint_parse(harness: Harness, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("bankstract.parse", fake_parse())
    harness.client.post(
        "/v1/parse", files=pdf_upload(), headers=auth_header(owner_test_key(harness, "insp_parse"))
    )

    assert audit_rows(harness)[-1]["endpoint"] == "parse"


# The wire models document the engine's report. These fail when the pin moves and the engine's
# shape or code list drifts, before /v1 clients see it.


def test_engine_report_round_trips_through_the_wire_model() -> None:
    report = IntegrityReport(bank="opay", format_version="opay-2026-02", signals=(_ERROR, _WARN))
    assert IntegrityReportOut.model_validate(report.to_dict()).model_dump() == report.to_dict()


def test_every_engine_signal_code_is_documented() -> None:
    doc = IntegritySignalOut.__doc__ or ""
    missing = [code for code in get_args(SignalCode) if f"`{code}`" not in doc]
    assert missing == []


def test_an_unreadable_file_is_not_a_counted_parse(harness: Harness) -> None:
    # Real engine: MINIMAL_PDF matches no bank, so the report carries an `unparseable` error signal
    # and the call is still a 200. "If the engine cannot read it, you do not pay": the audit row is
    # a failure, so it never counts toward the cap or the plan.
    key = owner_test_key(harness, "insp_unreadable")
    assert _post(harness, key).status_code == 200

    row = audit_rows(harness)[-1]
    assert (row["success"], row["error_class"], row["endpoint"]) == (0, "unparseable", "inspect")
    state = harness.client.app.state.app_state  # pyright: ignore[reportUnknownMemberType]
    assert (
        state.audit.count_success_for_owner_tier("insp_unreadable", "test", since_iso="2000-01-01")
        == 0
    )


def test_unreadable_files_do_not_burn_the_free_cap(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # TEST_TIER_MONTHLY_CAP is 3. Three unreadable uploads must leave the owner a full cap.
    key = owner_test_key(harness, "insp_cap_unreadable")
    for _ in range(3):
        assert _post(harness, key).status_code == 200

    _fake_inspect(monkeypatch)
    assert _post(harness, key).status_code == 200


def test_a_report_the_wire_model_cannot_read_is_a_500_that_is_not_counted(
    harness: Harness, monkeypatch: pytest.MonkeyPatch
) -> None:
    # A future engine minor could add a severity the wire model does not know. That must be a clean
    # 500 envelope, audited as a failure, and the statement text in `detail` must not leak.
    _fake_inspect(
        monkeypatch,
        IntegritySignal(code="checks_skipped", severity="info", detail=_DETAIL),  # pyright: ignore[reportArgumentType]
    )
    resp = _post(harness, owner_test_key(harness, "insp_shape"))

    assert resp.status_code == 500
    body = resp.json()
    assert body["error_class"] == "ReportShapeError"
    assert set(body) == {"error", "error_class", "format_version", "marker_coverage"}
    assert _DETAIL not in resp.text
    row = audit_rows(harness)[-1]
    assert (row["success"], row["error_class"], row["endpoint"]) == (
        0,
        "ReportShapeError",
        "inspect",
    )


def test_the_wire_severities_match_the_engines() -> None:
    wire = get_args(IntegritySignalOut.model_fields["severity"].annotation)
    assert set(wire) == set(get_args(Severity))
