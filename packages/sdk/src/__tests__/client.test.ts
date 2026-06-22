// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { TimeoutError } from '../errors'

import { API_KEY, captureError, jsonResponse, mockClient } from './helpers'

const OK = { format_version: null, metadata: null, totals: {}, row_wise_reconcilable: true, transactions: [] }

describe('client', () => {
  it('defaults the base URL when omitted', async () => {
    const { client, fetchMock } = mockClient(
      () => Promise.resolve(jsonResponse({ banks: [], engine_version: '0.11.0' })),
      null,
    )
    await client.banks()
    expect(fetchMock.mock.calls[0]![0]).toBe('https://bankstract.logickoder.dev/v1/banks')
  })

  it('accepts ArrayBuffer and Blob inputs', async () => {
    const { client } = mockClient(() => Promise.resolve(jsonResponse(OK)))
    await expect(client.parse(new ArrayBuffer(4))).resolves.toBeDefined()
    await expect(client.parse(new Blob([new Uint8Array([1])]))).resolves.toBeDefined()
  })

  it('wraps an aborted request as TimeoutError', async () => {
    const { client } = mockClient(() =>
      Promise.reject(Object.assign(new Error('timed out'), { name: 'TimeoutError' })),
    )
    await expect(client.parse(new Uint8Array([1]))).rejects.toBeInstanceOf(TimeoutError)
  })

  it('never leaks the API key in a thrown error', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(jsonResponse({ error: 'bad key', error_class: 'AuthError' }, 401)),
    )
    const err = await captureError(client.parse(new Uint8Array([1])))
    const dump = `${err.message} ${JSON.stringify(err)} ${err.stack ?? ''}`
    expect(dump).not.toContain(API_KEY)
  })
})
