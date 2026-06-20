// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'
import type { RefObject } from 'react'

import { LINK_CLASS } from '../lib/styles'

import { ResultActions } from './ResultActions'
import { ResultTable } from './ResultTable'
import type { TurnstileHandle } from './TurnstileGate'

interface ResultViewProps {
  data: ParseResponse
  file: File
  sample: boolean
  turnstile: RefObject<TurnstileHandle | null>
  onSampleCycle: () => void
  onReset: () => void
}

export function ResultView({
  data,
  file,
  sample,
  turnstile,
  onSampleCycle,
  onReset,
}: ResultViewProps) {
  return (
    <div className="flex flex-col gap-4">
      {sample ? (
        <p className="text-xs text-fg-secondary">
          Showing a redacted {data.metadata?.bank ?? ''} sample. Drop your own, or{' '}
          <button type="button" onClick={onSampleCycle} className={LINK_CLASS}>
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
        Your file leaves the worker the moment this page reloads. We log that it parsed — not what
        was in it.
      </p>

      <ResultActions data={data} file={file} turnstile={turnstile} onReset={onReset} />
    </div>
  )
}
