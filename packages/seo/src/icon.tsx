// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ImageResponse } from 'next/og'

import { Mark } from './mark'

export const APPLE_ICON_SIZE = { width: 180, height: 180 }
export const APPLE_ICON_CONTENT_TYPE = 'image/png'

const BG = '#0a0a0a'
const STACK = '#52525B'

// iOS home-screen icon (180x180, opaque - iOS masks its own corners). The extract mark, dim stack,
// centred in the dark square.
export function appleIcon(): ImageResponse {
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
        <Mark width={144} stack={STACK} />
      </div>
    ),
    { ...APPLE_ICON_SIZE },
  )
}
