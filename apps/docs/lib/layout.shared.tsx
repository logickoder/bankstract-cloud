// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

// The b mark, inlined: the docs app stays free of a @bankstract/ui dependency. These rows must match
// packages/ui/src/brand.tsx and packages/seo/src/mark.tsx (apps/web/src/lib/tokens.test.ts checks).
// [x1, x2, accent?] per row, in a 28-unit tall box. Stem and shoulder follow the nav text colour;
// the two bowl lines take the docs primary, which is the AA-safe shade in light and dark.
const ROWS: readonly (readonly [number, number, boolean])[] = [
  [0.4, 6.4, false],
  [0, 5.8, false],
  [0.5, 7, false],
  [-0.7, 15.2, false],
  [5, 14, true],
  [6.8, 11, true],
]
const STROKE = 3
const PITCH = (28 - STROKE) / (ROWS.length - 1)

function Logo() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontFamily: 'var(--font-fraunces), ui-serif, Georgia, serif',
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="-1 0 17 28"
        fill="none"
        aria-hidden="true"
        style={{ height: '0.74em', width: 'auto', marginRight: '0.04em' }}
      >
        {ROWS.map(([x1, x2, accent], i) => (
          <rect
            key={i}
            x={x1}
            y={i * PITCH}
            width={x2 - x1}
            height={STROKE}
            rx={STROKE / 2}
            fill={accent ? 'var(--color-fd-primary)' : 'currentColor'}
          />
        ))}
      </svg>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>b</span>
      <span>ankstract</span>
    </span>
  )
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Logo />,
    },
    links: [
      // Root-relative: Next basePath ('/docs') prepends the prefix, so this renders
      // /docs/api-reference. The bare /api path is a generated endpoint folder with no index page.
      { text: 'API', url: '/api-reference' },
      { text: 'GitHub', url: 'https://github.com/logickoder/bankstract-cloud' },
    ],
  }
}
