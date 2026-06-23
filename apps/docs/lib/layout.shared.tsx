// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'bankstract',
    },
    links: [
      // Root-relative: Next basePath ('/docs') prepends the prefix, so this renders
      // /docs/api-reference. The bare /api path is a generated endpoint folder with no index page.
      { text: 'API', url: '/api-reference' },
      { text: 'GitHub', url: 'https://github.com/logickoder/bankstract-cloud' },
    ],
  }
}
