# SPDX-License-Identifier: AGPL-3.0-only
# Copyright (C) 2026 Jeffery Orazulike
#
# Build context: repo root (needs the pnpm workspace + packages/).
FROM node:24-slim AS builder
RUN corepack enable
WORKDIR /repo

# Workspace manifests + shared packages first (cached until they change).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/demo/package.json ./apps/demo/package.json
RUN pnpm install --frozen-lockfile

# Source + build. The Turnstile site key is public and inlined at build (client widget);
# the worker URL and demo key are read at runtime by the server route, so not baked here.
COPY apps/demo ./apps/demo
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter demo build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next standalone output (monorepo layout: server.js lives under apps/demo/).
COPY --from=builder /repo/apps/demo/.next/standalone ./
COPY --from=builder /repo/apps/demo/.next/static ./apps/demo/.next/static

EXPOSE 3000
CMD ["node", "apps/demo/server.js"]
