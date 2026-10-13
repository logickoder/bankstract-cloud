// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { useClipboard } from '@bankstract/ui'
import { Check, Copy } from 'lucide-react'

// Copy-to-clipboard for code blocks. Always visible (discoverable + works on touch),
// swaps to a check on success. Copies the raw source, not the highlighted markup.
export function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useClipboard()

  return (
    <button
      type="button"
      onClick={() => void copy(text)}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="absolute top-1 right-1 z-10 flex size-11 items-center justify-center rounded-md text-fg-tertiary transition-colors hover:bg-bg-tertiary hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </button>
  )
}
