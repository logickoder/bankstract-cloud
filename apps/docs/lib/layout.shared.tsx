// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // Inline mark (the bankstract "extract" glyph) + wordmark. Inlined rather than imported from
      // @bankstract/ui to keep the docs app dependency-light; currentColor follows the nav text.
      title: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="8" viewBox="0 0 24 12" fill="none" aria-hidden="true">
            <rect x="5" y="0" width="14" height="2.5" rx="1.25" fill="#D2691E" />
            <rect x="5" y="5.5" width="10" height="2.5" rx="1.25" fill="currentColor" />
            <rect x="5" y="9.5" width="10" height="2.5" rx="1.25" fill="currentColor" />
          </svg>
          bankstract
        </span>
      ),
    },
    links: [
      // Root-relative: Next basePath ('/docs') prepends the prefix, so this renders
      // /docs/api-reference. The bare /api path is a generated endpoint folder with no index page.
      { text: 'API', url: '/api-reference' },
      { text: 'GitHub', url: 'https://github.com/logickoder/bankstract-cloud' },
    ],
  }
}
