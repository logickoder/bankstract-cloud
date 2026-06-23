// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST } from './route'

import { getUser } from '@/lib/session'
import type * as WorkerModule from '@/lib/worker'
import { workerFetch } from '@/lib/worker'

vi.mock('@/lib/session', () => ({ getUser: vi.fn() }))
vi.mock('@/lib/worker', async (importOriginal) => {
  const actual = await importOriginal<typeof WorkerModule>()
  // passthrough stays real (forwards status + body); only the outbound call is faked.
  return { ...actual, workerFetch: vi.fn() }
})

const mockGetUser = vi.mocked(getUser)
const mockWorkerFetch = vi.mocked(workerFetch)

function req(body: unknown): Request {
  return new Request('https://app.test/api/billing/init', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  // `??` is nullish: a set BETTER_AUTH_URL drives the callback origin deterministically.
  vi.stubEnv('BETTER_AUTH_URL', 'https://app.test')
})

describe('POST /api/billing/init', () => {
  it('401s when there is no session', async () => {
    mockGetUser.mockResolvedValue(null)

    const res = await POST(req({ tier: 'starter' }))

    expect(res.status).toBe(401)
    expect(mockWorkerFetch).not.toHaveBeenCalled()
  })

  it('422s an unknown tier', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'dev@acme.test' })

    const res = await POST(req({ tier: 'enterprise' }))

    expect(res.status).toBe(422)
    expect(mockWorkerFetch).not.toHaveBeenCalled()
  })

  it('422s a malformed body', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'dev@acme.test' })

    const bad = new Request('https://app.test/api/billing/init', { method: 'POST', body: 'x' })
    const res = await POST(bad)

    expect(res.status).toBe(422)
    expect(mockWorkerFetch).not.toHaveBeenCalled()
  })

  it('proxies a valid tier to the worker with owner, email, and callback_url', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'dev@acme.test' })
    mockWorkerFetch.mockResolvedValue(
      new Response(JSON.stringify({ authorization_url: 'https://paystack.test/checkout' }), {
        status: 200,
      }),
    )

    const res = await POST(req({ tier: 'growth' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ authorization_url: 'https://paystack.test/checkout' })

    expect(mockWorkerFetch).toHaveBeenCalledTimes(1)
    const [path, init] = mockWorkerFetch.mock.calls[0]!
    expect(path).toBe('/v1/admin/billing/subscribe')
    expect(init?.method).toBe('POST')
    expect(typeof init?.body).toBe('string')
    expect(JSON.parse(init!.body as string)).toEqual({
      owner: 'user_1',
      email: 'dev@acme.test',
      tier: 'growth',
      interval: 'monthly',
      callback_url: 'https://app.test/dashboard/billing',
    })
  })

  it('forwards interval=annual when set', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'dev@acme.test' })
    mockWorkerFetch.mockResolvedValue(
      new Response(JSON.stringify({ authorization_url: 'https://paystack.test/checkout' }), {
        status: 200,
      }),
    )

    await POST(req({ tier: 'scale', interval: 'annual' }))

    const [, init] = mockWorkerFetch.mock.calls[0]!
    const body = JSON.parse(init!.body as string) as { tier: string; interval: string }
    expect(body.tier).toBe('scale')
    expect(body.interval).toBe('annual')
  })

  it('forwards the worker status verbatim on failure', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'dev@acme.test' })
    mockWorkerFetch.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'tier growth not configured' }), { status: 503 }),
    )

    const res = await POST(req({ tier: 'growth' }))

    expect(res.status).toBe(503)
  })
})
