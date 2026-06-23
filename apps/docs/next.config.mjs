// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@bankstract/seo'],
  // Static export: docs are pure content, so Cloudflare Pages hosts the prerendered out/ as plain
  // static assets (free tier, no Workers/adapter). Search is a build-time Orama index the browser
  // queries client-side (see app/api/search + the RootProvider static client), so no server route.
  output: 'export',
  // output:'export' can't run the next/image optimizer; serve images as-is.
  images: { unoptimized: true },
  // Docs deploy to Cloudflare Pages but are surfaced at the product's /docs path: Caddy proxies
  // /docs/* to the Pages project. basePath namespaces every route + asset under /docs (assets ->
  // /docs/_next/*, the static search index -> /docs/api/search), so one proxy matcher covers it
  // without colliding with the web app's own /_next/*. Next prepends basePath to <Link> hrefs, so
  // app code + the fumadocs source loader use root-relative paths (baseUrl '/') and let basePath
  // add the prefix.
  basePath: '/docs',
}

export default withMDX(config)
