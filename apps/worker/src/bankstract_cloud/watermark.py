# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

"""Free-demo output watermarking. Cloud-worker concern only.

The engine stays MIT and always emits clean output, so self-host (docker-compose,
direct engine call) is never watermarked. Watermarking lives here and applies only to
the anonymous free-demo tier. Paid/test keys pass through untouched: no row truncation,
no value mangling, no schema change, just an additive banner (CSV) or envelope (JSON).
"""

from __future__ import annotations

from typing import Any

DEMO_TIER = "free_demo"

_UPGRADE_URL = "https://bankstract.logickoder.dev/#pricing"
_DEMO_NOTE = "Free demo output. Upgrade for clean, unwatermarked parses."


def watermark_csv(csv_bytes: bytes, *, tier: str) -> bytes:
    """Prepend a 4-line `#` comment banner for the free demo. No-op for paid tiers.

    `#` is the de facto CSV comment prefix (pandas `read_csv(comment='#')` skips it).
    The data section below the banner is byte-identical to the engine output.
    """
    if tier != DEMO_TIER:
        return csv_bytes
    banner = (
        "# bankstract free demo. Not for production use.\n"
        f"# Tier: {DEMO_TIER}\n"
        f"# Upgrade for unwatermarked output: {_UPGRADE_URL}\n"
        "# The data below is complete and unmodified.\n"
    ).encode()
    return banner + csv_bytes


def watermark_json(payload: dict[str, Any], *, tier: str, generated_at: str) -> dict[str, Any]:
    """Wrap the payload in a `_demo` envelope for the free demo. No-op for paid tiers.

    The original payload keys (metadata, transactions, ...) stay at the top level, so
    a client reading the B2B contract still finds them. Only the additive `_demo` key
    differs. `generated_at` is injected to keep this function pure.
    """
    if tier != DEMO_TIER:
        return payload
    return {
        "_demo": {
            "tier": DEMO_TIER,
            "generated_at": generated_at,
            "upgrade_url": _UPGRADE_URL,
            "note": _DEMO_NOTE,
        },
        **payload,
    }
