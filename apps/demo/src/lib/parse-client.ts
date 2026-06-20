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

// Posts to the same-origin proxy route, which attaches the server-only demo key.
// The browser never sees DEMO_API_KEY.
export async function parseStatement(file: File, turnstileToken: string): Promise<ParseResult> {
  let resp: Response
  try {
    resp = await fetch('/api/parse', { method: 'POST', body: parseForm(file, turnstileToken) })
  } catch {
    return { ok: false, code: 'network' }
  }

  if (!resp.ok) {
    const envelope = await readErrorEnvelope(resp)
    return {
      ok: false,
      code: codeForResponse(resp.status, envelope.errorClass, envelope.markerCoverage),
    }
  }

  const data = (await resp.json()) as ParseResponse
  return { ok: true, data }
}

// The worker's error envelope carries error_class + (for EmptyStatementError)
// marker_coverage. Best-effort — a missing or malformed body falls back to status-only.
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
