// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'
import { linkClass } from '@bankstract/ui'
import type { RefObject } from 'react'

import { ResultActions } from './ResultActions'
import { ResultTable } from './ResultTable'
import type { TurnstileHandle } from './TurnstileGate'

interface ResultViewProps {
  data: ParseResponse
  file: File
  sample: boolean
  overLimit: boolean
  turnstile: RefObject<TurnstileHandle | null>
  onSampleCycle: () => void
  onReset: () => void
}

export function ResultView({
  data,
  file,
  sample,
  overLimit,
  turnstile,
  onSampleCycle,
  onReset,
}: ResultViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {overLimit ? (
        <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          Free demo limit reached (50 parses/month). This is sample data, not your file. For real
          parses at volume,{' '}
          <a href="/#pricing" className={linkClass}>
            see the API
          </a>
          .
        </p>
      ) : null}

      {sample ? (
        <p className="text-xs text-fg-secondary">
          Showing a redacted {data.metadata?.bank ?? ''} sample. Drop your own, or{' '}
          <button type="button" onClick={onSampleCycle} className={linkClass}>
            try another bank
          </button>
          .
        </p>
      ) : null}

      <ResultTable data={data} />

      {sample ? (
        <p className="text-xs text-fg-secondary">
          Sample narrations stripped for privacy. Yours come back full.
        </p>
      ) : null}

      <p className="text-xs text-fg-tertiary">
        Your file leaves the worker the moment this page reloads. We log that it parsed. Not what
        was in it.
      </p>

      <ResultActions data={data} file={file} turnstile={turnstile} onReset={onReset} />
    </div>
  )
}
