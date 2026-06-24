// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ImageResponse } from 'next/og'

import { Mark } from './mark'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const BG = '#0a0a0a'
const FG = '#fafaf9'
const MUTED = '#a1a1aa'
const ACCENT = '#d2691e'

interface OgInput {
  /** Headline first line (foreground). */
  line1: string
  /** Headline second line (accent colour). */
  line2: string
  /** Supporting subtitle (muted). */
  subtitle: string
}

// The shared 1200x630 social card: brand mark + wordmark header, two-line headline (the second
// line accented), and a muted subtitle. Each surface supplies only the copy.
export function ogImage({ line1, line2, subtitle }: OgInput): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          padding: 80,
          color: FG,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Mark width={64} stack={MUTED} />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>bankstract</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, lineHeight: 1.1 }}>
            {line1}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.1,
              color: ACCENT,
            }}
          >
            {line2}
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: MUTED }}>
            {subtitle}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
