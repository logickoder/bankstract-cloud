// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'

// Shared across every Next app. next/font subsets, no CSS @import (DESIGN perf rule).
// Exposed as CSS variables consumed by the @theme font tokens in @bankstract/ui/theme.css.
// Apply all three .variable classes on <html> in each app's root layout.
export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})
