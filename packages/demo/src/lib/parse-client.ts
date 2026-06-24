// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'

import { codeForResponse, type DemoErrorCode } from './errors'

export type ParseResult =
  | { ok: true; data: ParseResponse }
  | { ok: false; code: DemoErrorCode }

function parseForm(file: File, turnstileToken: string): FormData {
  const form = new FormData()
  form.append('pdf', file)
  form.append('turnstile_token', turnstileToken)
  return form
}

export interface ParseProgress {
  stage: string
  current: number
  total: number
}

// Submits the upload as an async job and streams engine progress over SSE. Both hops go through the
// same-origin proxy, which attaches the server-only demo key; the browser never sees DEMO_API_KEY.
// onProgress fires per engine milestone; the promise resolves once the job reaches a terminal state.
export async function parseStatement(
  file: File,
  turnstileToken: string,
  onProgress?: (progress: ParseProgress) => void,
): Promise<ParseResult> {
  let submit: Response
  try {
    submit = await fetch('/api/parse/jobs', {
      method: 'POST',
      body: parseForm(file, turnstileToken),
    })
  } catch {
    return { ok: false, code: 'network' }
  }
  if (!submit.ok) {
    const envelope = await readErrorEnvelope(submit)
    return {
      ok: false,
      code: codeForResponse(submit.status, envelope.errorClass, envelope.markerCoverage),
    }
  }

  const { stream_url: streamUrl } = (await submit.json()) as { stream_url: string }
  return streamResult(streamUrl, onProgress)
}

// Drives the EventSource: default `message` frames carry progress, the final `result` event carries
// the parsed ParseResponse or the error envelope. Resolves (never rejects) so the caller maps one
// ParseResult. Closes on the result event so EventSource does not auto-reconnect to a finished job.
function streamResult(
  streamUrl: string,
  onProgress?: (progress: ParseProgress) => void,
): Promise<ParseResult> {
  return new Promise((resolve) => {
    const source = new EventSource(streamUrl)
    let settled = false
    const finish = (result: ParseResult): void => {
      if (settled) return
      settled = true
      source.close()
      resolve(result)
    }
    source.onmessage = (event) => {
      try {
        const progress = JSON.parse(event.data as string) as ParseProgress
        if (typeof progress.current === 'number') onProgress?.(progress)
      } catch {
        // ignore a malformed progress frame
      }
    }
    source.addEventListener('result', (event) => {
      try {
        const final = JSON.parse(event.data as string) as {
          state: string
          result?: ParseResponse
          error_class?: string
        }
        if (final.state === 'done' && final.result) {
          finish({ ok: true, data: final.result })
        } else {
          finish({ ok: false, code: codeForResponse(422, final.error_class, null) })
        }
      } catch {
        finish({ ok: false, code: 'network' })
      }
    })
    source.onerror = () => finish({ ok: false, code: 'network' })
  })
}

// The worker's error envelope carries error_class + (for EmptyStatementError)
// marker_coverage. Best-effort: a missing or malformed body falls back to status-only.
async function readErrorEnvelope(
  resp: Response,
): Promise<{ errorClass?: string; markerCoverage?: number | null }> {
  try {
    const body: unknown = await resp.json()
    if (body && typeof body === 'object') {
      const errorClass =
        'error_class' in body && typeof body.error_class === 'string'
          ? body.error_class
          : undefined
      const markerCoverage =
        'marker_coverage' in body && typeof body.marker_coverage === 'number'
          ? body.marker_coverage
          : null
      return { errorClass, markerCoverage }
    }
  } catch {
    // no JSON body
  }
  return {}
}

// Fetches a redacted sample from the engine fixtures (via our proxy) as a File the
// normal parse flow can consume.
export async function fetchSample(bank: string): Promise<File | null> {
  try {
    const resp = await fetch(`/api/sample?bank=${bank}`)
    if (!resp.ok) return null
    const blob = await resp.blob()
    return new File([blob], `${bank}-sample.pdf`, { type: 'application/pdf' })
  } catch {
    return null
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

// Re-posts to the proxy to get the engine's authoritative CSV (?format=csv) and
// triggers a download. Returns false on any failure so the caller can surface it.
export async function downloadCsv(file: File, turnstileToken: string): Promise<boolean> {
  try {
    const resp = await fetch('/api/parse?format=csv', {
      method: 'POST',
      body: parseForm(file, turnstileToken),
    })
    if (!resp.ok) return false
    triggerBlobDownload(await resp.blob(), 'statement.csv')
    return true
  } catch {
    return false
  }
}
