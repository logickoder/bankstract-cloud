# Infra

## Prod (`infra-prod/`)

- One Hetzner Arm box, 4GB RAM, plain `docker compose`: worker + the single `web` runtime + an internal Caddy + a nightly backup.
- A shared proxy on the box owns 80/443 and TLS. The stack's Caddy is the internal path router: `/v1/*`, `/healthz`, `/readyz` → worker; `/docs/*` → the Cloudflare Pages project; everything else → web. See `infra-prod/README.md`.
- SQLite in its own volume per app: `audit.sqlite` (worker), `auth.db` (web's Better Auth).
- Backups go nightly to Cloudflare R2.
- Domain: `bankstract.logickoder.dev`.
- Fixed cost is locked indie-cheap (about ₦5-6k/mo). Don't add a paid service without the owner.

## Deploy

- `.github/workflows/infra-prod-deploy.yml`: on push to `main`, builds the web + worker images to GHCR, then ssh-pulls and restarts on the box.
- `.github/workflows/docs-deploy.yml`: on push to `main`, builds `apps/docs` and deploys to Cloudflare Pages.
- Worker and web deploy together. A wire change that one side reads needs both in the same deploy.

## Self-host (`infra/`)

The public bundle (worker + thin demo) that backs the AGPL claim. See [license](license.md).
