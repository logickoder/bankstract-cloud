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

    demo_rate_limit_max: int = 10
    demo_rate_limit_window_seconds: int = 3600

    allowed_origins: str = "http://localhost:3000"

    demo_api_key: str = ""

    # Empty in dev => billing no-ops and only logs intent (Directive 6: no fake charges).
    stripe_secret_key: str = ""
    stripe_meter_event_name: str = "parses_v1"

    turnstile_secret_key: str = ""

    sentry_dsn: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def stripe_enabled(self) -> bool:
        return bool(self.stripe_secret_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
