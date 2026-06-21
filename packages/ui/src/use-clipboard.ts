// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { useCallback, useState } from 'react'

// Copy-to-clipboard with a transient `copied` flag. resetMs <= 0 keeps `copied` latched
// (caller clears it). Swallows failures: clipboard is unavailable in insecure contexts.
export function useClipboard(resetMs = 1500): {
  copied: boolean
  copy: (text: string) => Promise<void>
} {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (resetMs > 0) setTimeout(() => setCopied(false), resetMs)
      } catch {
        // clipboard unavailable (insecure context); no-op.
      }
    },
    [resetMs],
  )
  return { copied, copy }
}
