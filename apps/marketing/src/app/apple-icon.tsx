// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { appleIcon, APPLE_ICON_CONTENT_TYPE, APPLE_ICON_SIZE } from '@bankstract/seo'

export const dynamic = 'force-static'
export const size = APPLE_ICON_SIZE
export const contentType = APPLE_ICON_CONTENT_TYPE

export default function AppleIcon() {
  return appleIcon()
}
