// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { API_KEY, jsonResponse, mockClient } from './helpers'

const PARSE_BODY = {
  format_version: '1.0',
  metadata: null,
  totals: { credit: null, debit: null },
  row_wise_reconcilable: true,
  transactions: [],
}

describe('parse', () => {
  it('posts multipart to /v1/parse and returns the ParseResponse', async () => {
    const { client, fetchMock } = mockClient(() => Promise.resolve(jsonResponse(PARSE_BODY)))

    const result = await client.parse(new Uint8Array([1, 2, 3]), { filename: 'acme.pdf' })
    expect(result.format_version).toBe('1.0')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.test/v1/parse')
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers.authorization).toBe(`Bearer ${API_KEY}`)
    const body = init?.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('pdf')).toBeInstanceOf(Blob)
  })

  it('forwards bank when set', async () => {
    const { client, fetchMock } = mockClient(() => Promise.resolve(jsonResponse(PARSE_BODY)))
    await client.parse(new Uint8Array([1]), { bank: 'gtbank' })
    const body = fetchMock.mock.calls[0]![1]?.body as FormData
    expect(body.get('bank')).toBe('gtbank')
  })

  it('does not set Content-Type (fetch derives the multipart boundary)', async () => {
    const { client, fetchMock } = mockClient(() => Promise.resolve(jsonResponse(PARSE_BODY)))
    await client.parse(new Uint8Array([1]))
    const headers = fetchMock.mock.calls[0]![1]?.headers as Record<string, string>
    expect(headers['content-type']).toBeUndefined()
    expect(headers['Content-Type']).toBeUndefined()
  })
})
