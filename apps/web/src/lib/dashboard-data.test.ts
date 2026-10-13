// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { beforeEach, describe, expect, it, vi } from 'vitest'

const workerFetch = vi.fn<(...args: unknown[]) => Promise<Response>>()
vi.mock('./worker', () => ({ workerFetch: (...args: unknown[]) => workerFetch(...args) }))
vi.mock('./session', () => ({ getUserId: () => Promise.resolve('owner-1') }))

import { fetchBillingStatus, fetchKeys, fetchUsage } from './dashboard-data'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

// Braces: a returned function would be run by vitest as a cleanup hook, calling the mock again.
beforeEach(() => {
  workerFetch.mockReset()
})

// "Could not ask" must never look like "there are none". A customer with keys and a paid plan, during
// an outage, would otherwise be told to create a key or pick a plan.
describe('fetchKeys', () => {
  it('returns the keys when the worker answers', async () => {
    workerFetch.mockResolvedValue(json({ keys: [{ id: 'k1' }] }))
    expect(await fetchKeys()).toEqual([{ id: 'k1' }])
  })

  it('returns an empty list when the owner genuinely has no keys', async () => {
    workerFetch.mockResolvedValue(json({ keys: [] }))
    expect(await fetchKeys()).toEqual([])
  })

  it('returns null when the worker is unreachable', async () => {
    workerFetch.mockImplementation(() => Promise.reject(new Error('ECONNREFUSED')))
    expect(await fetchKeys()).toBeNull()
  })

  it('returns null when the worker answers with an error', async () => {
    workerFetch.mockResolvedValue(json({ error: 'boom' }, 500))
    expect(await fetchKeys()).toBeNull()
  })
})

describe('fetchUsage / fetchBillingStatus', () => {
  it('return null when the worker is unreachable', async () => {
    workerFetch.mockImplementation(() => Promise.reject(new Error('ECONNREFUSED')))
    expect(await fetchUsage()).toBeNull()
    expect(await fetchBillingStatus()).toBeNull()
  })
})
