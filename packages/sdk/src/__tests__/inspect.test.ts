// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { ForbiddenError, SubscriptionInactiveError } from '../errors'

import { API_KEY, captureError, jsonResponse, mockClient } from './helpers'

// Synthetic detail text (FOO / ACME): stands in for statement text the engine quotes.
const REPORT = {
  bank: 'fbn',
  format_version: 'fbn-2026-01',
  signals: [
    {
      code: 'reconciliation_failed',
      severity: 'error',
      detail: 'balance 1,111.00 does not follow FOO ACME TRANSFER',
      page: 2,
      row: 4,
    },
    { code: 'checks_skipped', severity: 'warn', detail: 'overlay check off', page: 3, row: null },
  ],
  clean: false,
}

describe('inspect', () => {
  it('posts multipart to /v1/inspect and returns the IntegrityReport', async () => {
    const { client, fetchMock } = mockClient(() => Promise.resolve(jsonResponse(REPORT)))

    const report = await client.inspect(new Uint8Array([1, 2, 3]), { filename: 'acme.pdf' })
    expect(report.clean).toBe(false)
    expect(report.signals.map((s) => s.code)).toEqual(['reconciliation_failed', 'checks_skipped'])
    expect(report.signals[1]?.row).toBeNull()

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/v1/inspect')
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers.authorization).toBe(`Bearer ${API_KEY}`)
    const body = init?.body as FormData
    expect(body.get('pdf')).toBeInstanceOf(Blob)
  })

  it('forwards bank when set', async () => {
    const { client, fetchMock } = mockClient(() => Promise.resolve(jsonResponse(REPORT)))
    await client.inspect(new Uint8Array([1]), { bank: 'zenith' })
    const body = fetchMock.mock.calls[0]![1]?.body as FormData
    expect(body.get('bank')).toBe('zenith')
  })

  it('returns a clean report as a normal result, not an error', async () => {
    const clean = { bank: 'opay', format_version: null, signals: [], clean: true }
    const { client } = mockClient(() => Promise.resolve(jsonResponse(clean)))
    const report = await client.inspect(new Uint8Array([1]))
    expect(report.clean).toBe(true)
    expect(report.signals).toEqual([])
  })

  it('maps the demo key refusal (403) to ForbiddenError', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(jsonResponse({ error: 'Inspect is not available on the demo.', error_class: 'PermissionError' }, 403)),
    )
    const err = await captureError<ForbiddenError>(client.inspect(new Uint8Array([1])))
    expect(err).toBeInstanceOf(ForbiddenError)
    expect(err.status).toBe(403)
    expect(err.errorClass).toBe('PermissionError')
  })

  it('keeps free_limit_reached as the errorClass on a 402', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(jsonResponse({ error: 'free tier limit reached', error_class: 'free_limit_reached' }, 402)),
    )
    const err = await captureError<SubscriptionInactiveError>(client.inspect(new Uint8Array([1])))
    expect(err).toBeInstanceOf(SubscriptionInactiveError)
    expect(err.errorClass).toBe('free_limit_reached')
  })
})
