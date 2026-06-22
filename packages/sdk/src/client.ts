// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { getJson, pdfForm, postMultipart, resolveConfig } from './http'
import type { BanksResponse, ParseResponse, RedactFormat, RedactResult, UsageResponse } from './types'

/** PDF bytes to parse. A `File` is a `Blob`, so it is accepted by the `Blob` member. */
export type PdfInput = Uint8Array | ArrayBuffer | Blob

export interface BankstractOptions {
  apiKey: string
  /** Defaults to `https://bankstract.logickoder.dev`. */
  baseUrl?: string
  /** Inject a `fetch` implementation (tests, custom agents). Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch
  /** Per-request timeout in ms. Defaults to 30000. A `signal` on a call overrides it. */
  timeoutMs?: number
}

export interface ParseOptions {
  /** Skip auto-detect and force a bank. Discover ids via `client.banks()`. */
  bank?: string
  /** Upload filename. Metadata only; defaults to `statement.pdf`. */
  filename?: string
  signal?: AbortSignal
}

export type RedactOptions = ParseOptions

export interface BankstractClient {
  parse(pdf: PdfInput, opts?: ParseOptions): Promise<ParseResponse>
  redact(pdf: PdfInput, opts?: RedactOptions): Promise<RedactResult>
  usage(): Promise<UsageResponse>
  banks(): Promise<BanksResponse>
}

function formatFromResponse(res: Response): RedactFormat {
  const contentType = res.headers.get('content-type') ?? ''
  return contentType.includes('spreadsheet') || contentType.includes('xlsx') ? 'xlsx' : 'pdf'
}

/** Create a bankstract API client. Server-side only: the API key is a secret, never ship it to a
 *  browser. Every call sends bytes and holds nothing; the SDK writes no PDF to disk. */
export function bankstract(options: BankstractOptions): BankstractClient {
  const cfg = resolveConfig(options)

  const client: BankstractClient = {
    async parse(pdf, opts) {
      const form = pdfForm(pdf, { bank: opts?.bank, filename: opts?.filename })
      const res = await postMultipart(cfg, '/v1/parse', form, opts?.signal)
      return (await res.json()) as ParseResponse
    },

    async redact(pdf, opts) {
      const form = pdfForm(pdf, { bank: opts?.bank, filename: opts?.filename, redact: true })
      const res = await postMultipart(cfg, '/v1/parse', form, opts?.signal)
      return {
        data: new Uint8Array(await res.arrayBuffer()),
        format: formatFromResponse(res),
        formatVersion: res.headers.get('x-bankstract-format-version'),
        redactions: Number(res.headers.get('x-bankstract-redactions') ?? '0'),
      }
    },

    usage() {
      return getJson<UsageResponse>(cfg, '/v1/usage')
    },

    banks() {
      return getJson<BanksResponse>(cfg, '/v1/banks')
    },
  }

  return Object.freeze(client)
}
