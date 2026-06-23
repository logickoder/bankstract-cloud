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

# The browser auth client base, baked at build. Empty = window origin (single-origin shell);
ARG NEXT_PUBLIC_BETTER_AUTH_URL=
ENV NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
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
