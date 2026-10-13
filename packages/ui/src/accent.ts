// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Accent themes. The CSS source is the `[data-theme]` blocks in theme.css; this mirrors the
// hex for places CSS vars cannot reach (next/og images, email HTML). `strong` is the text-safe
// shade on light surfaces, `onInk` the text-safe shade on dark ones, and `fg` the AA label color
// on a filled accent. Add a theme in both files.
export const ACCENTS = {
  orange: { accent: '#d2691e', strong: '#a8500f', onInk: '#d2691e', fg: '#14161f' },
  red: { accent: '#dc2626', strong: '#b91c1c', onInk: '#f05252', fg: '#ffffff' },
} as const

export type AccentTheme = keyof typeof ACCENTS

export function resolveAccentTheme(value: string | undefined): AccentTheme {
  return value !== undefined && value in ACCENTS ? (value as AccentTheme) : 'orange'
}
