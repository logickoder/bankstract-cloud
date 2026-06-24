// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { useReducer, useRef } from 'react'

import { SUPPORTED_BANKS } from '../lib/banks'
import { fetchSample, parseStatement } from '../lib/parse-client'
import { demoReducer, initialState } from '../lib/state'

import { ErrorPanel } from './ErrorPanel'
import { IdleView } from './IdleView'
import { ResultView } from './ResultView'
import { TurnstileGate, type TurnstileHandle } from './TurnstileGate'

const MAX_BYTES = 50 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

export function DemoClient() {
  const [state, dispatch] = useReducer(demoReducer, initialState)
  const turnstile = useRef<TurnstileHandle>(null)
  const sampleIndex = useRef(0)

  async function handleFile(file: File, sample = false) {
    if (file.size > MAX_BYTES) {
      dispatch({ type: 'PARSE_FAILED', code: 'too_large', file })
      return
    }
    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      dispatch({ type: 'PARSE_FAILED', code: 'wrong_type', file })
      return
    }

    dispatch({ type: 'PARSE_STARTED', file, sample })
    // Token obtained at submit time, freshest relative to the immediately-following POST.
    const token = (await turnstile.current?.getToken()) ?? ''
    const result = await parseStatement(file, token, (progress) =>
      dispatch({ type: 'PARSE_PROGRESS', progress }),
    )
    turnstile.current?.reset()

    if (result.ok) {
      dispatch({ type: 'PARSE_SUCCEEDED', data: result.data })
    } else {
      dispatch({ type: 'PARSE_FAILED', code: result.code, file })
    }
  }

  async function handleSample() {
    const bank = SUPPORTED_BANKS[sampleIndex.current % SUPPORTED_BANKS.length] ?? 'palmpay'
    sampleIndex.current += 1
    const file = await fetchSample(bank)
    if (file) {
      await handleFile(file, true)
    } else {
      dispatch({ type: 'PARSE_FAILED', code: 'network', file: null })
    }
  }

  return (
    <section className="w-full" aria-live="polite">
      <TurnstileGate ref={turnstile} />

      {state.status === 'result' ? (
        <ResultView
          data={state.data}
          file={state.file}
          sample={state.sample}
          turnstile={turnstile}
          onSampleCycle={() => void handleSample()}
          onReset={() => dispatch({ type: 'RESET' })}
        />
      ) : state.status === 'error' ? (
        <ErrorPanel
          code={state.code}
          bytes={state.file?.size ?? null}
          onRetry={() => dispatch({ type: 'RESET' })}
        />
      ) : (
        <IdleView
          status={state.status}
          activeFile={state.status === 'parsing' ? state.file : null}
          progress={state.status === 'parsing' ? state.progress : null}
          onFile={(file) => void handleFile(file)}
          onDragEnter={() => dispatch({ type: 'DRAG_ENTER' })}
          onDragLeave={() => dispatch({ type: 'DRAG_LEAVE' })}
          onSample={() => void handleSample()}
        />
      )}
    </section>
  )
}
