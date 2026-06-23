// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['@bankstract/seo'],
  // Docs deploy to Cloudflare Pages but are surfaced at the product's /docs path: Caddy proxies
  // /docs/* to the Pages project. basePath namespaces every route + asset under /docs (assets ->
  // /docs/_next/*, search -> /docs/api/search), so one proxy matcher covers it without colliding
  // with the web app's own /_next/*. Next prepends basePath to <Link> hrefs, so app code + the
  // fumadocs source loader use root-relative paths (baseUrl '/') and let basePath add the prefix.
  basePath: '/docs',
}

export default withMDX(config)
