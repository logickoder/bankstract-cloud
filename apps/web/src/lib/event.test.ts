// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { describe, expect, it } from 'vitest'

import { EVENT, eventBootScript, isEventActive } from './event'

// Lagos is UTC+1 all year, so "until the 16th" means the end of the 16th there.
describe('isEventActive', () => {
  it('is active before and during the window', () => {
    expect(isEventActive(Date.parse('2026-10-13T09:00:00+01:00'))).toBe(true)
    expect(isEventActive(Date.parse('2026-10-16T12:00:00+01:00'))).toBe(true)
  })

  it('is still active in the last second of the 16th, Lagos time', () => {
    expect(isEventActive(Date.parse('2026-10-16T23:59:59+01:00'))).toBe(true)
  })

  it('is off from midnight on the 17th, Lagos time', () => {
    expect(isEventActive(Date.parse('2026-10-17T00:00:00+01:00'))).toBe(false)
    expect(isEventActive(Date.parse('2026-11-01T00:00:00+01:00'))).toBe(false)
  })
})

// Evaluates the generated script against a fake document and clock, returning what it set on <html>.
function runBootScript(now: number): Record<string, string> {
  const attrs: Record<string, string> = {}
  const documentElement = {
    setAttribute: (key: string, value: string) => {
      attrs[key] = value
    },
  }
  class FakeDate extends Date {
    static override now(): number {
      return now
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- evaluating our own generated script
  const run = new Function('document', 'Date', eventBootScript()) as (d: unknown, D: unknown) => void
  run({ documentElement }, FakeDate)
  return attrs
}

describe('eventBootScript', () => {
  it('embeds the same cutoff and theme the config declares', () => {
    const script = eventBootScript()
    expect(script).toContain(EVENT.endsAt)
    expect(script).toContain(EVENT.theme)
    expect(script).toContain(EVENT.id)
  })

  it('sets the theme and event attributes while active', () => {
    expect(runBootScript(Date.parse('2026-10-14T10:00:00+01:00'))).toEqual({
      'data-theme': EVENT.theme,
      'data-event': EVENT.id,
    })
  })

  it('sets nothing once the event has ended, so the page keeps its default theme', () => {
    expect(runBootScript(Date.parse('2026-10-17T00:00:01+01:00'))).toEqual({})
  })
})
