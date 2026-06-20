// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import type { ParseResponse } from '@bankstract/types'
import { type RefObject, useState } from 'react'

import { downloadCsv, triggerBlobDownload } from '../lib/parse-client'

import type { TurnstileHandle } from './TurnstileGate'
import { Button } from './ui/Button'

interface ResultActionsProps {
  data: ParseResponse
  file: File
  turnstile: RefObject<TurnstileHandle | null>
  onReset: () => void
}

export function ResultActions({ data, file, turnstile, onReset }: ResultActionsProps) {
  const [busy, setBusy] = useState(false)
  const [csvFailed, setCsvFailed] = useState(false)

  // JSON is the exact payload already in memory. Serialize client-side, no re-parse.
  function handleJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    triggerBlobDownload(blob, 'statement.json')
  }

  // CSV comes from the engine writer (?format=csv). Re-post to get it authoritative.
  async function handleCsv() {
    setBusy(true)
    setCsvFailed(false)
    const token = (await turnstile.current?.getToken()) ?? ''
    const ok = await downloadCsv(file, token)
    turnstile.current?.reset()
    setBusy(false)
    setCsvFailed(!ok)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={handleJson}>
          Download JSON
        </Button>
        <Button variant="secondary" onClick={() => void handleCsv()} disabled={busy}>
          {busy ? 'Preparing CSV…' : 'Download CSV'}
        </Button>
        <Button variant="ghost" onClick={onReset}>
          Parse another
        </Button>
      </div>
      {csvFailed ? (
        <p className="text-xs text-error">CSV export failed. Try again, or download JSON.</p>
      ) : null}
    </div>
  )
}
