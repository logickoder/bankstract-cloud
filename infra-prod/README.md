<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- Copyright (C) 2026 Jeffery Orazulike -->

# infra-prod

The owner's full production stack: **worker + app (dashboard) + demo** behind Caddy, plus a nightly R2 backup. This is distinct from [`infra/`](../infra), which is the public worker+demo self-host bundle (the AGPL claim). Marketing and docs are hosted on Cloudflare Pages, not on this box.

## Topology

```
Cloudflare (TLS, CDN, Turnstile)
        │
        ▼  proxied A record -> box IP
   Caddy :80
        ├── /v1/*  /healthz  /readyz   -> worker:8000
        ├── /app/*                     -> app:3000   (built with basePath /app)
        └── /  (everything else)       -> demo:3000
```

Cloudflare terminates TLS (use SSL mode **Full**); Caddy serves plain `:80`. Marketing + docs go on Cloudflare Pages (separate setup; e.g. the apex or a Pages project).

## Hosting

Recommended: a **Hetzner Cloud CAX21** (Arm, 4 vCPU / 8GB, ~EUR 6.5/mo) + Cloudflare in front. Any Docker host works; the compose is portable.

Create the server:

1. `console.hetzner.cloud` -> your project -> **Add Server**.
2. **Location**: an EU one (Nuremberg / Falkenstein / Helsinki). Arm (CAX) is EU-only.
3. **Image**: Ubuntu 24.04.
4. Server type -> **Shared vCPU** -> **Arm64 (Ampere)** tab -> **CAX21**. (CAX is hidden until you pick the Arm tab + an EU location.)
5. Attach your SSH key, create.

Then harden + install Docker:

```bash
apt update && apt upgrade -y
apt install -y ufw fail2ban
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
curl -fsSL https://get.docker.com | sh
```

**Build RAM**: the app image runs a full `pnpm install` + `next build`, which can spike past 4GB. CAX21 (8GB) builds on-box comfortably. On a 4GB CAX11, build the images in CI and have the box pull them instead of building on-box.

**Coolify (optional) vs the Caddy in this stack**: Coolify runs its own reverse proxy on :80/:443 and is shaped for "one service = one subdomain". This stack does single-domain **path** routing via its own Caddy, which fights that model. Simplest: run this stack as plain `docker compose` (below) behind Cloudflare, and use Coolify only for other per-subdomain projects. If Coolify must own :80, give this stack's Caddy an internal port and route the domain to it from Coolify.

**No-passport fallbacks** (if a host's KYC blocks you), all run this compose unchanged: Oracle Cloud Always-Free Arm (`$0`, card-only), Hostinger VPS (~`$5`, card-only), or a home machine + Cloudflare Tunnel (`$0`, no public IP/ports).

## Deploy

```bash
cd infra-prod
cp .env.example .env        # fill the REQUIRED values (see below)
docker compose up --build -d
```

On first boot the app runs `drizzle-kit push` to create the Better Auth schema in the `auth` volume, then serves. The worker runs its Alembic migrations the same way.

## Filling `.env`

Three tiers. Generate the random secrets with `openssl`:

```bash
openssl rand -hex 32                      # -> ADMIN_API_TOKEN
openssl rand -hex 32                      # -> BETTER_AUTH_SECRET
echo "bsk_test_$(openssl rand -hex 16)"   # -> DEMO_API_KEY
```

**Tier 1 - required to boot.** With only these, the stack comes up: worker parses (test keys, free), demo works, dashboard loads. But nobody can sign in yet (Tier 2).

- `PUBLIC_ORIGIN` - the product domain, e.g. `https://bankstract.logickoder.dev`.
- `ADMIN_API_TOKEN` - shared app <-> worker admin token (the `openssl` output).
- `BETTER_AUTH_SECRET` - session signing key (the `openssl` output).
- `DEMO_API_KEY` - shared demo <-> worker key (a `bsk_test_` value).

**Tier 2 - so users can sign in (pick at least one).** Without one, sign-in does not work in prod (magic links only print to the app's server log).

- **Resend** (magic-link email, easiest): `resend.com` -> API Keys -> `RESEND_API_KEY=re_...`. Free tier; verify a sending domain in Cloudflare DNS first (until then you can only email yourself).
- **Google / GitHub OAuth**: create an OAuth app, set the callback to `<PUBLIC_ORIGIN>/app/api/auth/callback/<provider>` (see below), fill the client id + secret.

**Tier 3 - defer until ready (empty = feature off).**

- **Paystack** (after KYC): dashboard -> API keys (`sk_live_`) + create the subscription plans -> `PLN_` codes for each tier (monthly + annual). Empty = billing off, test keys still work.
- **Turnstile**: demo bot gate. `TURNSTILE_SECRET_KEY` + the public site key from Cloudflare.
- **Sentry**: `SENTRY_DSN` from sentry.io.
- **R2 backup**: Cloudflare -> R2 -> bucket + S3 API token -> `R2_*`. Empty = local snapshots only.

First deploy: fill **Tier 1 + Resend**, leave the rest empty, get it live, then add the others incrementally.

## Cloudflare + DNS

1. Proxied `A` record: `bankstract.logickoder.dev` -> the box IP.
2. SSL/TLS mode: **Full**.
3. Marketing + docs: a Cloudflare Pages project (the box does not serve them).

## OAuth callbacks (important)

The app is path-routed under `/app`, so Better Auth lives at `<PUBLIC_ORIGIN>/app/api/auth`. Register the OAuth callbacks accordingly:

- Google: `<PUBLIC_ORIGIN>/app/api/auth/callback/google`
- GitHub: `<PUBLIC_ORIGIN>/app/api/auth/callback/github`

## Post-deploy verification

The `basePath: /app` routing is only exercisable in this prod topology (dev/e2e run at root). After the first deploy, **verify the auth flow under `/app`**:

- `GET <PUBLIC_ORIGIN>/app/sign-in` renders.
- Magic-link or OAuth sign-in completes and lands on `<PUBLIC_ORIGIN>/app/dashboard`.
- The dashboard reads usage/billing (confirms the app -> worker admin proxy + `ADMIN_API_TOKEN` match).

If sign-in misbehaves, check `BETTER_AUTH_URL` ends with `/app` and the OAuth callbacks include `/app`.

## Backups

The `backup` sidecar snapshots both SQLite DBs nightly via `sqlite3 .backup` (WAL-safe) and `rclone` to R2. Set `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_ENDPOINT`. Empty bucket = local snapshots only.

## Volumes

`audit` (worker DB), `auth` (app DB), `caddy_data` + `caddy_config`. Back up the two DB volumes; the rest is reproducible.
