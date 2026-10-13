// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ImageResponse } from 'next/og'

import { Mark } from './mark'

export const APPLE_ICON_SIZE = { width: 180, height: 180 }
export const APPLE_ICON_CONTENT_TYPE = 'image/png'

const BG = '#14161f'
const INK = '#fafaf9'
const ACCENT = '#f08a3c'

// iOS home-screen icon (180x180, opaque - iOS masks its own corners). The b mark, light on the ink
// square, with a heavier stroke than the in-page mark so it holds on a home screen. Return the global Response (ImageResponse extends it) so consumers in
// other packages can name the type without reaching into this package's nested next/og (TS2742).
export function appleIcon(): Response {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
        }}
      >
        <Mark height={112} ink={INK} accent={ACCENT} stroke={3} />
      </div>
    ),
    { ...APPLE_ICON_SIZE },
  )
}
