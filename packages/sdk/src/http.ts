// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { BankstractOptions, PdfInput } from './client'
import { BankstractError, errorFromResponse, TimeoutError } from './errors'

export interface ResolvedConfig {
  apiKey: string
  baseUrl: string
  fetchImpl: typeof fetch
  timeoutMs: number
}

const DEFAULT_BASE_URL = 'https://bankstract.logickoder.dev'
const DEFAULT_TIMEOUT_MS = 30_000

export function resolveConfig(options: BankstractOptions): ResolvedConfig {
  const fetchImpl = options.fetch ?? globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    throw new BankstractError(
      'global fetch is unavailable; run on Node 18+ or pass { fetch } in the SDK options',
      { status: 0, errorClass: 'SetupError' },
    )
  }
  return {
    apiKey: options.apiKey,
    baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
    fetchImpl,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  }
}

function toBlob(pdf: PdfInput): Blob {
  return pdf instanceof Blob ? pdf : new Blob([pdf])
}

export function pdfForm(
  pdf: PdfInput,
  fields: { bank?: string; filename?: string; redact?: boolean },
): FormData {
  const form = new FormData()
  form.append('pdf', toBlob(pdf), fields.filename ?? 'statement.pdf')
  if (fields.bank) form.append('bank', fields.bank)
  if (fields.redact) form.append('redact', 'true')
  return form
}

async function send(
  cfg: ResolvedConfig,
  path: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
): Promise<Response> {
  let res: Response
  try {
    res = await cfg.fetchImpl(`${cfg.baseUrl}${path}`, {
      ...init,
      // Let fetch derive the multipart boundary from the FormData body; never hand-set
      // Content-Type or the boundary is lost and the worker cannot read the upload.
      headers: { authorization: `Bearer ${cfg.apiKey}`, ...init.headers },
      signal: signal ?? AbortSignal.timeout(cfg.timeoutMs),
    })
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new TimeoutError('bankstract request aborted (timeout or caller signal)', {
        status: 0,
        errorClass: 'TimeoutError',
      })
    }
    throw err
  }
  if (!res.ok) throw await errorFromResponse(res)
  return res
}

export async function getJson<T>(cfg: ResolvedConfig, path: string): Promise<T> {
  const res = await send(cfg, path, { method: 'GET' }, undefined)
  return (await res.json()) as T
}

export function postMultipart(
  cfg: ResolvedConfig,
  path: string,
  form: FormData,
  signal: AbortSignal | undefined,
): Promise<Response> {
  return send(cfg, path, { method: 'POST', body: form }, signal)
}
