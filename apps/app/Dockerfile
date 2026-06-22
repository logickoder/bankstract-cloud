# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike
#
# Build context: repo root (needs the pnpm workspace + packages/).
#
# Unlike the demo (Next standalone), the app keeps its full node_modules in the runtime image:
# the entrypoint runs `drizzle-kit push` (a devDep) to create the Better Auth schema in the
# mounted volume on first boot. A slightly larger image buys a one-line, reliable migration step.
FROM node:24-slim AS app
RUN corepack enable
WORKDIR /repo

# Workspace manifests + shared packages first (cached until they change).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/app/package.json ./apps/app/package.json
RUN pnpm install --frozen-lockfile

COPY apps/app ./apps/app

# Path-routed under /app behind Caddy: basePath is baked at build. APP_BASE_PATH drives next.config;
# NEXT_PUBLIC_APP_BASE_PATH reaches the browser auth client. Build empty to serve at root.
ARG APP_BASE_PATH=/app
# Absolute auth base for the browser client (e.g. https://host/app). Empty in a plain build.
ARG NEXT_PUBLIC_BETTER_AUTH_URL=
ENV APP_BASE_PATH=$APP_BASE_PATH \
    NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    # Build-only placeholder so Better Auth init during prerender doesn't error; the runtime
    # value is supplied by compose (and MUST be a real secret) and overrides this.
    BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime
RUN pnpm --filter app build

WORKDIR /repo/apps/app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
EXPOSE 3000
# Create the auth schema in the mounted volume (AUTH_DB_PATH), then serve. Idempotent.
CMD ["sh", "-c", "pnpm exec drizzle-kit push --force && pnpm start"]
