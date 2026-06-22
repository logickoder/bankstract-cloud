// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { mockClient } from './helpers'

describe('redact', () => {
  it('returns redacted bytes plus parsed headers', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4])
    const { client, fetchMock } = mockClient(() =>
      Promise.resolve(
        new Response(bytes, {
          status: 200,
          headers: {
            'content-type': 'application/pdf',
            'x-bankstract-redactions': '7',
            'x-bankstract-format-version': '1.2',
          },
        }),
      ),
    )

    const result = await client.redact(new Uint8Array([9]), { bank: 'uba' })
    expect(Array.from(result.data)).toEqual([1, 2, 3, 4])
    expect(result.format).toBe('pdf')
    expect(result.redactions).toBe(7)
    expect(result.formatVersion).toBe('1.2')

    const body = fetchMock.mock.calls[0]![1]?.body as FormData
    expect(body.get('redact')).toBe('true')
  })

  it('detects xlsx from the content-type', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(
        new Response(new Uint8Array([1]), {
          status: 200,
          headers: {
            'content-type':
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'x-bankstract-redactions': '0',
          },
        }),
      ),
    )
    const result = await client.redact(new Uint8Array([1]))
    expect(result.format).toBe('xlsx')
    expect(result.redactions).toBe(0)
  })
})
