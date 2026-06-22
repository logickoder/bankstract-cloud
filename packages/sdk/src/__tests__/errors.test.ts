// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import {
  AuthError,
  PayloadTooLargeError,
  RateLimitError,
  ServerError,
  SubscriptionInactiveError,
  UnsupportedStatementError,
} from '../errors'

import { captureError, jsonResponse, mockClient } from './helpers'

const CASES = [
  { status: 401, errorClass: 'AuthError', type: AuthError },
  { status: 402, errorClass: 'subscription_inactive', type: SubscriptionInactiveError },
  { status: 413, errorClass: 'PayloadTooLarge', type: PayloadTooLargeError },
  { status: 422, errorClass: 'LayoutDriftError', type: UnsupportedStatementError },
  { status: 500, errorClass: 'WorkerError', type: ServerError },
] as const

describe('error mapping', () => {
  for (const c of CASES) {
    it(`maps ${c.status} to ${c.type.name}`, async () => {
      const { client } = mockClient(() =>
        Promise.resolve(jsonResponse({ error: 'x', error_class: c.errorClass }, c.status)),
      )
      const err = await captureError(client.parse(new Uint8Array([1])))
      expect(err).toBeInstanceOf(c.type)
      expect(err.status).toBe(c.status)
      expect(err.errorClass).toBe(c.errorClass)
    })
  }

  it('parses Retry-After on 429', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'slow down', error_class: 'RateLimitError' }), {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '30' },
        }),
      ),
    )
    const err = await captureError<RateLimitError>(client.parse(new Uint8Array([1])))
    expect(err).toBeInstanceOf(RateLimitError)
    expect(err.retryAfter).toBe(30)
  })

  it('surfaces marker_coverage on 422', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(
        jsonResponse({ error: 'empty', error_class: 'EmptyStatementError', marker_coverage: 0.9 }, 422),
      ),
    )
    const err = await captureError<UnsupportedStatementError>(client.parse(new Uint8Array([1])))
    expect(err.markerCoverage).toBe(0.9)
  })

  it('tolerates a non-JSON 5xx body', async () => {
    const { client } = mockClient(() =>
      Promise.resolve(new Response('gateway boom', { status: 502 })),
    )
    const err = await captureError<ServerError>(client.parse(new Uint8Array([1])))
    expect(err).toBeInstanceOf(ServerError)
    expect(err.status).toBe(502)
  })
})
