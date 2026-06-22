// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { vi } from 'vitest'

import { bankstract } from '../client'
import type { BankstractError } from '../errors'

export const API_KEY = 'bsk_test_secret_key_123'

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>

// `null` forces the SDK's own default baseUrl (a `string | undefined` default param can't,
// since passing `undefined` re-triggers the default value).
export function mockClient(impl: FetchImpl, baseUrl: string | null = 'https://api.test') {
  const fetchMock = vi.fn(impl)
  const client = bankstract({
    apiKey: API_KEY,
    baseUrl: baseUrl ?? undefined,
    fetch: fetchMock as unknown as typeof fetch,
  })
  return { client, fetchMock }
}

/** Await a call that must reject and return its (typed) error. Fails if the call resolves. */
export async function captureError<T extends Error = BankstractError>(
  promise: Promise<unknown>,
): Promise<T> {
  try {
    await promise
  } catch (err) {
    return err as T
  }
  throw new Error('expected the call to reject, but it resolved')
}
