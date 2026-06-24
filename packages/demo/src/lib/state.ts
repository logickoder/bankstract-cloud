// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'

import type { DemoErrorCode } from './errors'
import type { ParseProgress } from './parse-client'

export type DemoState =
  | { status: 'idle' }
  | { status: 'dragover' }
  | { status: 'parsing'; file: File; sample: boolean; progress: ParseProgress | null }
  | { status: 'result'; data: ParseResponse; file: File; sample: boolean }
  | { status: 'error'; code: DemoErrorCode; file: File | null }

export type DemoAction =
  | { type: 'DRAG_ENTER' }
  | { type: 'DRAG_LEAVE' }
  | { type: 'PARSE_STARTED'; file: File; sample: boolean }
  | { type: 'PARSE_PROGRESS'; progress: ParseProgress }
  | { type: 'PARSE_SUCCEEDED'; data: ParseResponse }
  | { type: 'PARSE_FAILED'; code: DemoErrorCode; file: File | null }
  | { type: 'RESET' }

export const initialState: DemoState = { status: 'idle' }

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'DRAG_ENTER':
      return state.status === 'idle' ? { status: 'dragover' } : state
    case 'DRAG_LEAVE':
      return state.status === 'dragover' ? { status: 'idle' } : state
    case 'PARSE_STARTED':
      return { status: 'parsing', file: action.file, sample: action.sample, progress: null }
    case 'PARSE_PROGRESS':
      return state.status === 'parsing' ? { ...state, progress: action.progress } : state
    case 'PARSE_SUCCEEDED':
      return state.status === 'parsing'
        ? { status: 'result', data: action.data, file: state.file, sample: state.sample }
        : state
    case 'PARSE_FAILED':
      return { status: 'error', code: action.code, file: action.file }
    case 'RESET':
      return initialState
  }
}
