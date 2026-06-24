# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike
#
# Build context: repo root (needs the pnpm workspace + packages/).
#
# The one prod web app (marketing / + demo /demo + dashboard /app). Keeps its full node_modules in
# the runtime image: the entrypoint runs `drizzle-kit push` (a devDep) to create the Better Auth
# schema in the mounted volume on first boot. A slightly larger image buys a reliable migration step.
FROM node:24-slim AS web
RUN corepack enable
WORKDIR /repo

# Workspace manifests + shared packages first (cached until they change).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web

# Public env baked into the client bundle at build (NEXT_PUBLIC_* are inlined by `next build`,
# so they MUST be present here, not just at runtime). Empty BETTER_AUTH_URL = window origin
# (single-origin shell). TURNSTILE_SITE_KEY drives the /demo widget; without it the bundle ships
# the test key. DOCS_URL is the same-domain /docs path (Caddy proxies it to the off-box Pages
# project), so in-app docs links are root-relative.
ARG NEXT_PUBLIC_BETTER_AUTH_URL=
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
# Non-empty defaults: the surface code reads `env ?? fallback`, and an empty string is NOT caught
# by ?? (only null/undefined is), so an empty ENV would inline as a broken "" canonical/docs URL.
ARG NEXT_PUBLIC_SITE_URL=https://bankstract.logickoder.dev
ARG NEXT_PUBLIC_DOCS_URL=/docs
# Same-origin signup in the merged web. Drives the marketing signup CTA + the demo "get a key"
# conversion link. Unset in the standalone demo bundle, where that CTA stays hidden.
ARG NEXT_PUBLIC_APP_URL=/sign-up
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_DOCS_URL=$NEXT_PUBLIC_DOCS_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    # Build-only placeholder so Better Auth init during prerender doesn't error; the runtime value
    # is supplied by compose (and MUST be a real secret) and overrides this.
    BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime \
    # Next's "collect page data" eagerly opens the libSQL client; point it at a writable throwaway
    # during the build. The runtime AUTH_DB_PATH (the volume) overrides it.
    AUTH_DB_PATH=/tmp/build-auth.db
RUN pnpm --filter web build

WORKDIR /repo/apps/web
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000
# Create the auth schema in the mounted volume (AUTH_DB_PATH), then serve. Idempotent.
CMD ["sh", "-c", "pnpm exec drizzle-kit push --force && pnpm start"]
