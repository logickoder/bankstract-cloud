// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Design tokens as data, for places CSS vars cannot reach (next/og images, email HTML) and for the
// drift test in apps/web (src/lib/tokens.test.ts), which fails when theme.css, the docs theme, the
// email shell or the OG card stop matching. theme.css stays the runtime source: change a value
// there, then here, and the test names every copy that lags.
//
// Accent themes. `strong` is the text-safe shade on light surfaces, `onInk` the text-safe shade on
// dark ones, `fg` the AA label color on a filled accent, `tints` the four data tints. Add a theme
// here and as a `[data-theme]` block in theme.css.
export const ACCENTS = {
  orange: {
    accent: '#d2691e',
    strong: '#a8500f',
    onInk: '#d2691e',
    fg: '#14161f',
    tints: ['#dfe98f', '#ffe27a', '#ffcfa8', '#e5dcff'],
  },
  red: {
    accent: '#dc2626',
    strong: '#b91c1c',
    onInk: '#f05252',
    fg: '#ffffff',
    tints: ['#ffc9cf', '#ffe0dc', '#f3e3c3', '#e9d5f0'],
  },
} as const

// The paper surface (`.surface-paper`) and the ink surface (`.surface-ink`).
export const PAPER = {
  bg: '#fcfbf9',
  bgSecondary: '#f4f2ee',
  bgTertiary: '#ebe8e2',
  fg: '#14161f',
  fgSecondary: '#4f5360',
  fgTertiary: '#666a77',
  border: '#e4e1da',
} as const

export const INK = {
  bg: '#0a0a0a',
  bgSecondary: '#111418',
  bgTertiary: '#1a1d23',
  fg: '#fafaf9',
  fgSecondary: '#a1a1aa',
  fgTertiary: '#71717a',
  border: '#27272a',
} as const

export type AccentTheme = keyof typeof ACCENTS

export function resolveAccentTheme(value: string | undefined): AccentTheme {
  return value !== undefined && Object.hasOwn(ACCENTS, value) ? (value as AccentTheme) : 'orange'
}
