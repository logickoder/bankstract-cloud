<!-- SPDX-License-Identifier: AGPL-3.0-only -->
<!-- Copyright (C) 2026 Jeffery Orazulike -->

# infra-prod

The owner's full production stack: **worker + web** behind Caddy, plus a nightly R2 backup. `web` is one Next runtime serving marketing `/`, the demo `/demo`, and the dashboard (`/dashboard`, `/sign-in`, `/api/*`) - one process to keep RAM low on a 4GB box. This is distinct from [`infra/`](../infra), the public worker+demo self-host bundle (the AGPL claim). Docs are a Cloudflare Pages project (off this box) surfaced at the same-domain `/docs` path: Caddy proxies `/docs/*` to the Pages host, and the docs app sets Next basePath `/docs` so its assets + search live under that prefix.

## Topology

```
DNS (Namecheap A record) -> box IP
        │
        ▼
   Shared proxy :443  (owns 80/443 + TLS; Coolify / NPM / Traefik)
        │  routes the product hostname ->
        ▼
   caddy:80  (internal path-router, this stack, on the `proxy` network)
        ├── /v1/*  /healthz  /readyz   -> worker:8000
        ├── /docs  /docs/*             -> Cloudflare Pages (DOCS_UPSTREAM, off-box)
        └── /  (everything else)       -> web:3000
              ├── /            marketing
              ├── /demo        consumer demo
              └── /dashboard   dashboard + /sign-in + /api/*
```

A **shared reverse proxy** on the box (Coolify / Nginx Proxy Manager / Traefik) owns ports 80/443, terminates TLS, and routes the product hostname to this stack's `caddy` on an external `proxy` network. So you can host other apps on the same box, each with its own A record + its own setup, all fronted by that one proxy. This stack's Caddy is internal-only (plain HTTP on `:80`, no cert): it keeps bankstract's path split self-contained, so the outer proxy needs just one rule, `<hostname> -> caddy:80`. Docs deploy to a Cloudflare Pages project; Caddy reverse-proxies `/docs/*` to it (`DOCS_UPSTREAM` = the Pages host), so docs share the product domain at `/docs`. The docs app's Next basePath `/docs` namespaces its assets (`/docs/_next/*`) and search (`/docs/api/search`) under that one matcher.

## Hosting

Recommended: a **Hetzner Cloud CAX21** (Arm, 4 vCPU / 8GB, ~EUR 6.5/mo). Any Docker host works; the compose is portable.

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

**Build RAM**: the web image runs a full `pnpm install` + `next build`, which can spike past 4GB. CAX21 (8GB) builds on-box comfortably. On a 4GB CAX11, build the image in CI and have the box pull it instead of building on-box.

**The shared proxy.** This stack expects an outer proxy to own 80/443 so the box can host multiple independent apps. Pick one and create its network once:

- **Coolify**: it ships its own proxy + a `coolify` docker network. Deploy this stack as a Docker Compose resource, set `PROXY_NETWORK=coolify`, and point the domain at `caddy` (port 80) in the UI; Coolify provisions TLS.
- **Nginx Proxy Manager / Traefik**: `docker network create proxy`, attach the proxy to it, then `PROXY_NETWORK=proxy`. Add a proxy host `bankstract.logickoder.dev -> caddy:80` and request a Let's Encrypt cert there.

Either way this stack's Caddy stays internal; the outer proxy does TLS + hostname routing. Other apps get their own A record + compose, fronted by the same proxy.

**No-passport fallbacks** (if a host's KYC blocks you), all run this compose unchanged: Oracle Cloud Always-Free Arm (`$0`, card-only), Hostinger VPS (~`$5`, card-only), or a home machine + Cloudflare Tunnel (`$0`, no public IP/ports).

## Deploy

```bash
cd infra-prod
cp .env.example .env        # fill the REQUIRED values (see below)
# Ensure the shared proxy's network exists (skip if your proxy already made it, e.g. Coolify):
docker network create proxy 2>/dev/null || true
docker compose up --build -d
```

Then register the route in your proxy: hostname `<PUBLIC_ORIGIN host>` -> `caddy:80`, TLS on. On first boot `web` runs `drizzle-kit push` to create the Better Auth schema in the `auth` volume, then serves. The worker runs its Alembic migrations the same way.

## Continuous deploy

Push to `main` deploys itself - no SSH by hand. The [`Deploy infra-prod`](../.github/workflows/infra-prod-deploy.yml) workflow builds the `web` + `worker` images for `linux/amd64` (the box is x86), pushes them to GHCR, then SSHes the box to `git pull && docker compose pull && up -d`. The 4GB box only runs containers; it never builds (that would OOM on `next build`).

One-time setup:

1. **Bootstrap the box** (once): clone the repo to a path, create `infra-prod/.env` (see below), `docker network create proxy`, bring up the shared proxy + this stack manually the first time.
2. **GHCR packages public**: after the first workflow run creates `bankstract-cloud-web` + `bankstract-cloud-worker`, set both packages to **public** (GitHub -> your profile -> Packages -> each -> Package settings -> Change visibility). Then the box pulls without auth. (Alternative: `docker login ghcr.io` on the box with a read PAT.)
3. **Repo secrets** (Settings -> Secrets and variables -> Actions):
   - `DEPLOY_HOST` - box IP/hostname
   - `DEPLOY_USER` - ssh user
   - `DEPLOY_SSH_KEY` - a private key whose public half is in the box's `~/.ssh/authorized_keys`
   - `DEPLOY_PATH` - absolute path to the cloned repo on the box
   - `DEPLOY_PORT` - optional, defaults to 22
4. Optional repo **variables** (build-time, baked into the `web` image by CI): `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (else the bundle bakes the test key) and `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` (Cloudflare Web Analytics beacon; empty = no beacon). Both are GitHub Actions repo variables, not box runtime env.

After that, every push touching `apps/web`, `apps/worker`, `packages`, or `infra-prod` ships automatically. `workflow_dispatch` runs it manually. Pin `IMAGE_TAG` in `.env` to a commit SHA to freeze a release; `latest` tracks main.

## Filling `.env`

Three tiers. Generate the random secrets with `openssl`:

```bash
openssl rand -hex 32                      # -> ADMIN_API_TOKEN
openssl rand -hex 32                      # -> BETTER_AUTH_SECRET
echo "bsk_test_$(openssl rand -hex 16)"   # -> DEMO_API_KEY
```

**Tier 1 - required to boot.** With only these, the stack comes up: worker parses (test keys, free up to 25 parses/owner/month then a canned sample), the demo works, the dashboard loads. But nobody can sign in yet (Tier 2).

- `PUBLIC_ORIGIN` - the product domain, e.g. `https://bankstract.logickoder.dev`.
- `ADMIN_API_TOKEN` - shared web <-> worker admin token (the `openssl` output).
- `BETTER_AUTH_SECRET` - session signing key (the `openssl` output).
- `DEMO_API_KEY` - shared web <-> worker demo key (a `bsk_test_` value).

**Tier 2 - so users can sign in (pick at least one).** Without one, sign-in does not work in prod (magic links only print to the web server log).

- **Resend** (magic-link email, easiest): `resend.com` -> API Keys -> `RESEND_API_KEY=re_...`. Free tier; verify a sending domain in your DNS first (until then you can only email yourself).
- **Google / GitHub OAuth**: create an OAuth app, set the callback to `<PUBLIC_ORIGIN>/api/auth/callback/<provider>` (see below), fill the client id + secret.

**Tier 3 - defer until ready (empty = feature off).**

- **Paystack** (after KYC): dashboard -> API keys (`sk_live_`) + create the subscription plans -> `PLN_` codes for each tier (monthly + annual). Empty = billing off, test keys still work. See [PRICING.md](../PRICING.md) for exact plan names, amounts, and env var mapping.
- **Turnstile**: demo bot gate. `TURNSTILE_SECRET_KEY` + the public site key from Cloudflare.
- **Sentry**: `SENTRY_DSN` from sentry.io.
- **R2 backup**: Cloudflare -> R2 -> bucket + S3 API token -> `R2_*`. Empty = local snapshots only.

First deploy: fill **Tier 1 + Resend**, leave the rest empty, get it live, then add the others incrementally.

## DNS

1. `A` record: `bankstract.logickoder.dev` -> the box IP (Namecheap; DNS-only, no Cloudflare proxy). It hits the shared proxy, which routes the hostname to `caddy:80` and provisions TLS. Other apps on the box get their own A records pointed at the same IP, each routed by the proxy.
2. Docs: no DNS record needed. The docs ship to a Cloudflare Pages project (see below) and Caddy proxies `/docs/*` to its host on the product domain.

## Docs deploy

Docs are a static export (`apps/docs`, Next `output: 'export'`) hosted free on Cloudflare Pages. The [`docs deploy`](../.github/workflows/docs-deploy.yml) workflow builds + deploys on every push to `main` that touches `apps/docs/**` (or runs manually via `workflow_dispatch`). Search is a build-time index the browser queries client-side, so there is no server runtime.

One-time setup:

1. Cloudflare -> My Profile -> API Tokens -> create a token with **Account · Cloudflare Pages · Edit**.
2. Add two repo secrets (Settings -> Secrets -> Actions): `CLOUDFLARE_API_TOKEN` (that token) and `CLOUDFLARE_ACCOUNT_ID` (Cloudflare dashboard -> any domain -> Account ID).
3. Push to `main` (or run the workflow manually). The first run auto-creates the `bankstract-docs` Pages project.
4. Set `DOCS_UPSTREAM` in `.env` to the resulting host (e.g. `bankstract-docs.pages.dev`). Caddy proxies `/docs/*` there; `basePath '/docs'` keeps assets + the search index under that one prefix.

## OAuth callbacks (important)

Auth is origin-based (the dashboard is a route group, not an `/app` path), so Better Auth lives at `<PUBLIC_ORIGIN>/api/auth`. Register the OAuth callbacks accordingly:

- Google: `<PUBLIC_ORIGIN>/api/auth/callback/google`
- GitHub: `<PUBLIC_ORIGIN>/api/auth/callback/github`

## Post-deploy verification

After the first deploy, verify the surfaces + auth flow:

- `GET <PUBLIC_ORIGIN>/` renders marketing; `/demo` renders the demo; `/docs` serves docs and search returns hits (confirms the `DOCS_UPSTREAM` proxy + basePath).
- `GET <PUBLIC_ORIGIN>/sign-in` renders, and magic-link or OAuth sign-in lands on `<PUBLIC_ORIGIN>/dashboard`.
- The dashboard reads usage/billing (confirms the web -> worker admin proxy + `ADMIN_API_TOKEN` match).

If sign-in misbehaves, check `BETTER_AUTH_URL` is the bare `<PUBLIC_ORIGIN>` (no `/app`) and the OAuth callbacks have no `/app`.

## Backups

The `backup` sidecar snapshots both SQLite DBs nightly via `sqlite3 .backup` (WAL-safe) and `rclone` to R2. Set `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` / `R2_ENDPOINT`. Empty bucket = local snapshots only.

## Volumes

`audit` (worker DB) and `auth` (web's Better Auth DB). Back these two up; everything else is reproducible. (No Caddy cert volumes - TLS lives on the outer proxy now.)
