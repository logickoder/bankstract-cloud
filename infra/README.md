# Self-host

Run the whole stack (FastAPI worker + Next.js demo behind a Caddy reverse proxy) with one command. This is the verifiable AGPL self-host claim: the same code that runs the hosted service runs here.

## Quick start

```bash
cd infra
cp .env.example .env        # adjust if you like; defaults work locally
docker compose up --build
```

Then open <http://localhost> for the consumer demo. The B2B API is on the same host under `/v1`:

```bash
curl -X POST http://localhost/v1/parse \
  -H "Authorization: Bearer $DEMO_API_KEY" \
  -F "pdf=@statement.pdf"
```

(`DEMO_API_KEY` defaults to `bsk_test_demo_selfhost`. Issue your own keys with the worker's `KeyStore`. A self-serve dashboard ships in `apps/app`.)

## What runs

| Service | Image | Role |
|---------|-------|------|
| `worker` | built from `apps/worker` | FastAPI: `/v1/parse`, redact, `?format=csv`, auth, metadata-only audit |
| `demo` | built from `apps/demo` | Next.js consumer demo + its server-side `/api/parse` proxy |
| `caddy` | `caddy:2-alpine` | reverse proxy: `/v1/*` + health → worker, everything else → demo |

Routing lives in [`Caddyfile`](./Caddyfile). The 52 MB `request_body` cap matches the worker's 50 MB limit (with multipart headroom). Without it the proxy would clip large uploads before the worker sees them.

## Privacy + state

- The worker parses in memory and writes **nothing** to disk except the metadata-only audit log (`/data/audit.sqlite` on the `audit` volume). No PDF bytes, no transaction data.
- The browser never sees `DEMO_API_KEY`. The demo's server route attaches it. `DEMO_API_KEY` must be identical for the `worker` and `demo` services (the compose file wires both from the same variable).

## Production

1. **Domain + TLS.** Edit `Caddyfile`: replace `:80` with your hostname (e.g. `bankstract.example.com`). Caddy auto-provisions a Let's Encrypt cert. Behind Cloudflare (which terminates TLS), keep `:80`.
2. **Turnstile.** Provision a real Cloudflare Turnstile widget, then set `TURNSTILE_SECRET_KEY` (worker) and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (demo, build-time). Empty secret = verification disabled = the demo is open to abuse.
3. **Billing.** Set `STRIPE_SECRET_KEY` for metered billing; empty = free self-host. Billing is migrating to Paystack NGN (see CHANGELOG); the worker reads `STRIPE_SECRET_KEY` until that lands.
4. **Backups.** Persist the `audit` volume if you want the audit trail across redeploys.

## Updating

```bash
docker compose up --build -d        # rebuild + restart in the background
docker compose logs -f worker demo  # tail logs
docker compose down                 # stop (volumes persist)
```
