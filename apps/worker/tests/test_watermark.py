# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from typing import Any

from bankstract_cloud.watermark import DEMO_TIER, watermark_csv, watermark_json

CSV = b"date,amount,balance\n2026-01-01,100.00,500.00\n2026-01-02,-50.00,450.00\n"
PAYLOAD: dict[str, Any] = {
    "metadata": {"bank": "fbn", "account_holder": "FOO"},
    "transactions": [{"amount": "100.00"}, {"amount": "-50.00"}],
}


def test_csv_demo_gets_four_comment_lines_and_unmodified_data() -> None:
    out = watermark_csv(CSV, tier=DEMO_TIER)
    comment_lines = [line for line in out.splitlines() if line.startswith(b"#")]
    assert len(comment_lines) == 4
    # Data section below the banner is byte-identical: no row truncation, no mangling.
    assert out.endswith(CSV)
    data_lines = [line for line in out.splitlines() if line and not line.startswith(b"#")]
    assert len(data_lines) == len(CSV.splitlines())


def test_csv_paid_tier_passes_through() -> None:
    assert watermark_csv(CSV, tier="live") == CSV


def test_json_demo_envelope_preserves_payload() -> None:
    out = watermark_json(PAYLOAD, tier=DEMO_TIER, generated_at="2026-06-21T00:00:00+00:00")
    assert out["_demo"]["tier"] == DEMO_TIER
    assert out["_demo"]["generated_at"] == "2026-06-21T00:00:00+00:00"
    assert out["_demo"]["upgrade_url"]
    # Original statement + transactions stay at the top level, identical.
    assert out["metadata"] == PAYLOAD["metadata"]
    assert out["transactions"] == PAYLOAD["transactions"]


def test_json_paid_tier_passes_through() -> None:
    out = watermark_json(PAYLOAD, tier="live", generated_at="x")
    assert "_demo" not in out
    assert out == PAYLOAD


def test_non_demo_tiers_emit_clean_output_like_self_host() -> None:
    # Self-host (direct engine call) has no free_demo tier; any non-demo tier = clean.
    for tier in ("live", "test", "self-host", ""):
        assert watermark_csv(CSV, tier=tier) == CSV
        assert watermark_json(PAYLOAD, tier=tier, generated_at="x") == PAYLOAD
