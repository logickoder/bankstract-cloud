// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'bankstract',
    },
    links: [
      { text: 'API', url: '/docs/api' },
      { text: 'GitHub', url: 'https://github.com/logickoder/bankstract-cloud' },
    ],
  }
}
