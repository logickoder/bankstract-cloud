// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'
import { describe, expect, it } from 'vitest'

import { demoReducer, initialState } from './state'

const file = new File(['%PDF'], 'statement.pdf', { type: 'application/pdf' })

const response: ParseResponse = {
  format_version: 'fbn-2026-01',
  metadata: null,
  totals: { credit: '500.00', debit: '0' },
  row_wise_reconcilable: true,
  transactions: [],
}

describe('demoReducer', () => {
  it('enters and leaves dragover from idle', () => {
    const over = demoReducer(initialState, { type: 'DRAG_ENTER' })
    expect(over.status).toBe('dragover')
    expect(demoReducer(over, { type: 'DRAG_LEAVE' }).status).toBe('idle')
  })

  it('ignores DRAG_ENTER when not idle', () => {
    const parsing = demoReducer(initialState, { type: 'PARSE_STARTED', file, sample: false })
    expect(demoReducer(parsing, { type: 'DRAG_ENTER' })).toBe(parsing)
  })

  it('transitions parsing -> result on success', () => {
    const parsing = demoReducer(initialState, { type: 'PARSE_STARTED', file, sample: false })
    const result = demoReducer(parsing, { type: 'PARSE_SUCCEEDED', data: response })
    expect(result).toEqual({ status: 'result', data: response, file, sample: false })
  })

  it('ignores PARSE_SUCCEEDED when not parsing (illegal transition is a no-op)', () => {
    expect(demoReducer(initialState, { type: 'PARSE_SUCCEEDED', data: response })).toBe(
      initialState,
    )
  })

  it('transitions to error on failure', () => {
    const err = demoReducer(initialState, { type: 'PARSE_FAILED', code: 'unsupported', file })
    expect(err).toEqual({ status: 'error', code: 'unsupported', file })
  })

  it('RESET returns to idle', () => {
    const err = demoReducer(initialState, { type: 'PARSE_FAILED', code: 'network', file: null })
    expect(demoReducer(err, { type: 'RESET' })).toBe(initialState)
  })
})
