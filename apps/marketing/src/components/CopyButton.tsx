// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

// Copy-to-clipboard for code blocks. Always visible (discoverable + works on touch),
// swaps to a check on success. Copies the raw source, not the highlighted markup.
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable (insecure context); no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="absolute top-2 right-2 z-10 rounded-md border border-border bg-bg-secondary p-1.5 text-fg-tertiary transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
    </button>
  )
}
