// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import * as Sentry from '@sentry/nextjs'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { initSentry, scrubEvent } from './sentry'

vi.mock('@sentry/nextjs', () => ({ init: vi.fn() }))

const initMock = vi.mocked(Sentry.init)

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('initSentry', () => {
  it('no-ops without SENTRY_DSN', () => {
    vi.stubEnv('SENTRY_DSN', '')
    initSentry()
    expect(initMock).not.toHaveBeenCalled()
  })

  it('inits with the privacy options when a DSN is set', () => {
    vi.stubEnv('SENTRY_DSN', 'https://k@o0.ingest.sentry.io/1')
    initSentry()
    expect(initMock).toHaveBeenCalledOnce()
    const opts = initMock.mock.calls[0]![0]
    // Directive 1: these are the privacy invariant; the test fails if any loosens.
    expect(opts.tracesSampleRate).toBe(0)
    expect(opts.sendDefaultPii).toBe(false)
    expect(opts.beforeSend).toBe(scrubEvent)
  })
})

describe('scrubEvent', () => {
  it('strips request body, headers, cookies, and query string', () => {
    const event = {
      request: {
        data: 'secret=1',
        headers: { authorization: 'Bearer token' },
        cookies: { s: '1' },
        query_string: 'a=b',
      },
    } as unknown as Sentry.ErrorEvent

    const out = scrubEvent(event)

    expect(out.request?.data).toBeUndefined()
    expect(out.request?.headers).toBeUndefined()
    expect(out.request?.cookies).toBeUndefined()
    expect(out.request?.query_string).toBeUndefined()
  })
})
