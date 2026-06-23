// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import {
  codeForResponse,
  codeForStatus,
  type DemoErrorCode,
  ERROR_COPY,
  tooLargeCopy,
} from './errors'

describe('codeForStatus', () => {
  it.each([
    [401, 'unauthorized'],
    [413, 'too_large'],
    [422, 'unsupported'],
    [429, 'rate_limited'],
    [500, 'server_error'],
    [418, 'server_error'],
  ])('maps %i -> %s', (status, expected) => {
    expect(codeForStatus(status)).toBe(expected)
  })
})

describe('codeForResponse', () => {
  it('routes each typed engine error_class', () => {
    expect(codeForResponse(422, 'EncryptedSourceError')).toBe('encrypted')
    expect(codeForResponse(422, 'LayoutDriftError')).toBe('drift')
    expect(codeForResponse(422, 'ReconciliationError')).toBe('reconcile')
    expect(codeForResponse(422, 'ParseError')).toBe('unsupported')
    expect(codeForResponse(422, undefined)).toBe('unsupported')
  })

  it('branches EmptyStatementError on marker_coverage (0.95 boundary)', () => {
    expect(codeForResponse(422, 'EmptyStatementError', 0.99)).toBe('empty')
    expect(codeForResponse(422, 'EmptyStatementError', 0.5)).toBe('drift')
    expect(codeForResponse(422, 'EmptyStatementError', null)).toBe('drift')
  })

  it('falls back to status mapping for framework classes', () => {
    expect(codeForResponse(429, 'RateLimitError')).toBe('rate_limited')
    expect(codeForResponse(413, 'PayloadTooLarge')).toBe('too_large')
    expect(codeForResponse(401, 'AuthError')).toBe('unauthorized')
  })
})

describe('ERROR_COPY', () => {
  it('has non-empty copy for every code', () => {
    const codes: DemoErrorCode[] = [
      'too_large',
      'wrong_type',
      'unauthorized',
      'rate_limited',
      'encrypted',
      'empty',
      'drift',
      'reconcile',
      'unsupported',
      'server_error',
      'network',
    ]
    for (const code of codes) {
      expect(ERROR_COPY[code].length).toBeGreaterThan(0)
    }
  })
})

describe('tooLargeCopy', () => {
  it('reports the actual MB sent, rounded', () => {
    expect(tooLargeCopy(67 * 1024 * 1024)).toBe(
      'File too big. 67 MB sent, 50 MB cap. Trim or split it, then try again.',
    )
  })
})
