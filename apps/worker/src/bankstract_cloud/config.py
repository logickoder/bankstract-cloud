# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


# One env for every surface: the repo-root .env (dev). Absent in the prod container, where
# compose injects real env vars (pydantic reads os.environ over the file), so this is dev-only
# and harmless when missing. extra="ignore" means the worker reads only its own vars and skips
# the web/demo vars that share the file.
def _find_root_env() -> str | None:
    # Walk up for the shared .env instead of assuming a fixed parent index: the monorepo depth
    # differs from the prod container (/app/src/bankstract_cloud), where a hardcoded parents[4]
    # raises IndexError at import. None => no file, so pydantic reads os.environ only.
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.is_file():
            return str(candidate)
    return None


_ROOT_ENV = _find_root_env()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ROOT_ENV, extra="ignore")

    env: Literal["development", "production"] = "development"

    audit_db_path: str = "./audit.sqlite"

    # 50 MB hard cap (PRD open-question B, locked). Enforced before the engine runs.
    max_upload_bytes: int = 52_428_800

    # Async parse jobs (/v1/parse/jobs). max_concurrent gates simultaneous engine threads:
    # pdfplumber peaks ~150-300MB per large statement, so keep this low on the shared 4GB box
    # (web coexists). job_ttl retains a terminal job + its result in RAM for the poll fallback.
    parse_max_concurrent: int = 2
    job_ttl_seconds: int = 300
    sse_throttle_ms: int = 150  # min interval between progress events streamed to a client

    # Free demo: 50 parses/month per IP (PRD § Pricing). 30-day rolling window.
    demo_rate_limit_max: int = 50
    demo_rate_limit_window_seconds: int = 2_592_000

    # Salt for the demo rate-limit IP hash. We never store a raw client IP; the bucket key is
    # sha256(salt + ip). Set a stable per-deploy secret in prod (empty in dev still hashes, but
    # an unsalted IPv4 hash is brute-forceable, so prod must set this). See /privacy.
    rate_limit_ip_salt: str = ""

    # Parse metadata (audit_log) retention. Rows older than this are purged by the background
    # sweep (storage limitation, NDPR). Must exceed the billing window so overage metering,
    # which reads the current + just-closed calendar month, is never starved.
    audit_retention_days: int = 90

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
    # Annual prepay plans (yearly interval, 15% off). Separate Paystack PLN_ codes per tier;
    # the tier still drives the cap/overage, the interval only selects which plan is charged.
    paystack_plan_starter_annual: str = ""
    paystack_plan_growth_annual: str = ""
    paystack_plan_scale_annual: str = ""

    turnstile_secret_key: str = ""

    sentry_dsn: str = ""

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    def _plan_codes(self) -> list[tuple[str, str, str]]:
        # The single enumeration of the plan-code settings: (tier, interval, code). Both the
        # forward lookup and the webhook reverse map derive from it, so adding a tier/interval
        # is a one-place edit.
        return [
            ("starter", "monthly", self.paystack_plan_starter),
            ("growth", "monthly", self.paystack_plan_growth),
            ("scale", "monthly", self.paystack_plan_scale),
            ("starter", "annual", self.paystack_plan_starter_annual),
            ("growth", "annual", self.paystack_plan_growth_annual),
            ("scale", "annual", self.paystack_plan_scale_annual),
        ]

    def plan_for(self, tier: str, interval: str) -> str:
        """Paystack plan code for a (tier, interval). Empty string when unconfigured."""
        for t, iv, code in self._plan_codes():
            if t == tier and iv == interval:
                return code
        return ""

    @property
    def tier_by_paystack_plan(self) -> dict[str, str]:
        # Reverse map for webhook plan_code -> tier, across BOTH intervals (a subscription.create
        # carries whichever plan was charged). Empty (unconfigured) codes are skipped so a blank
        # dev config never maps "" to a tier.
        return {code: tier for tier, _interval, code in self._plan_codes() if code}


@lru_cache
def get_settings() -> Settings:
    return Settings()
