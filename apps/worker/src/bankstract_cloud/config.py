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

    # Empty in dev => billing no-ops and only logs intent (Directive 6: no fake charges).
    stripe_secret_key: str = ""
    stripe_meter_event_name: str = "parses_v1"

    turnstile_secret_key: str = ""

    sentry_dsn: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
