# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: Literal["development", "production"] = "development"

    audit_db_path: str = "./audit.sqlite"

    # 50 MB hard cap (PRD open-question B, locked). Enforced before the engine runs.
    max_upload_bytes: int = 52_428_800

    # Free demo: 50 parses/month per IP (PRD § Pricing). 30-day rolling window.
    demo_rate_limit_max: int = 50
    demo_rate_limit_window_seconds: int = 2_592_000

    allowed_origins: str = "http://localhost:3000"

    demo_api_key: str = ""

    # Bearer token that gates the key-management endpoints (/v1/keys). Empty = the
    # endpoints are DISABLED. Never treat "" as a valid token (it would let anyone
    # mint keys). Set this only where you run the dashboard / admin tooling.
    admin_api_token: str = ""

    # Paystack (NGN subscriptions). Empty secret => billing disabled (dev no-op, no fake
    # charges, Directive 6). Plan codes are the Paystack dashboard PLN_ codes per paid tier;
    # owner provisions the plans and fills these before deploy.
    paystack_secret_key: str = ""
    paystack_plan_starter: str = ""
    paystack_plan_growth: str = ""
    paystack_plan_scale: str = ""

    turnstile_secret_key: str = ""

    sentry_dsn: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def paystack_plan_by_tier(self) -> dict[str, str]:
        return {
            "starter": self.paystack_plan_starter,
            "growth": self.paystack_plan_growth,
            "scale": self.paystack_plan_scale,
        }

    @property
    def tier_by_paystack_plan(self) -> dict[str, str]:
        # Reverse map for webhook plan_code -> tier. Empty (unconfigured) codes are skipped
        # so a blank dev config never maps "" to a tier.
        return {code: tier for tier, code in self.paystack_plan_by_tier.items() if code}


@lru_cache
def get_settings() -> Settings:
    return Settings()
