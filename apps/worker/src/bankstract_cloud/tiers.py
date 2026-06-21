# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from __future__ import annotations

from dataclasses import dataclass

# Paid-tier economics (PRD § Pricing). Monthly cap is included parses; beyond it, each
# parse meters at overage_kobo (NGN kobo). Paystack amounts are in kobo, so we keep the
# rate in kobo to avoid float currency math. Failed parses never count toward the cap.


@dataclass(frozen=True)
class Tier:
    name: str
    monthly_cap: int
    overage_kobo: int  # per parse beyond the cap


TIERS: dict[str, Tier] = {
    "starter": Tier(name="starter", monthly_cap=1_000, overage_kobo=1_500),  # ₦15
    "growth": Tier(name="growth", monthly_cap=10_000, overage_kobo=1_200),  # ₦12
    "scale": Tier(name="scale", monthly_cap=100_000, overage_kobo=800),  # ₦8
}
