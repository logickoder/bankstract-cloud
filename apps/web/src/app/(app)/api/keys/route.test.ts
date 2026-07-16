// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as createLive } from './route'
import { POST as rollTest } from './test/route'

import { requireOwner } from '@/lib/session'
import type * as WorkerModule from '@/lib/worker'
import { workerFetch } from '@/lib/worker'

vi.mock('@/lib/session', () => ({ requireOwner: vi.fn() }))
vi.mock('@/lib/worker', async (importOriginal) => {
  const actual = await importOriginal<typeof WorkerModule>()
  return { ...actual, workerFetch: vi.fn() }
})

const mockRequireOwner = vi.mocked(requireOwner)
const mockWorkerFetch = vi.mocked(workerFetch)

function req(body: unknown): Request {
  return new Request('https://app.test/api/keys', { method: 'POST', body: JSON.stringify(body) })
}

function created(): Response {
  return new Response(JSON.stringify({ key: 'bsk_test_x', id: 'k1' }), { status: 201 })
}

beforeEach(() => vi.clearAllMocks())

describe('POST /api/keys (live)', () => {
  it('401s without a session', async () => {
    mockRequireOwner.mockResolvedValue(
      NextResponse.json({ error: 'unauthenticated' }, { status: 401 }),
    )
    const res = await createLive(req({ name: 'prod' }))
    expect(res.status).toBe(401)
    expect(mockWorkerFetch).not.toHaveBeenCalled()
  })

  it('422s a nameless body', async () => {
    mockRequireOwner.mockResolvedValue('user_1')
    const res = await createLive(req({}))
    expect(res.status).toBe(422)
    expect(mockWorkerFetch).not.toHaveBeenCalled()
  })

  it('forces env=live and injects the owner', async () => {
    mockRequireOwner.mockResolvedValue('user_1')
    mockWorkerFetch.mockResolvedValue(created())
    const res = await createLive(req({ name: 'prod' }))
    expect(res.status).toBe(201)
    const [path, init] = mockWorkerFetch.mock.calls[0]!
    expect(path).toBe('/v1/keys')
    expect(JSON.parse(init!.body as string)).toEqual({ name: 'prod', env: 'live', owner: 'user_1' })
  })
})

describe('POST /api/keys/test (roll)', () => {
  it('401s without a session', async () => {
    mockRequireOwner.mockResolvedValue(
      NextResponse.json({ error: 'unauthenticated' }, { status: 401 }),
    )
    const res = await rollTest()
    expect(res.status).toBe(401)
    expect(mockWorkerFetch).not.toHaveBeenCalled()
  })

  it('rolls the owner test key via the worker', async () => {
    mockRequireOwner.mockResolvedValue('user_1')
    mockWorkerFetch.mockResolvedValue(created())
    const res = await rollTest()
    expect(res.status).toBe(201)
    const [path, init] = mockWorkerFetch.mock.calls[0]!
    expect(path).toBe('/v1/keys/test')
    expect(JSON.parse(init!.body as string)).toEqual({ owner: 'user_1' })
  })
})
