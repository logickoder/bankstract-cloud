// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// The dashboard is greyscale. A tile takes a tint only when its number needs attention, so colour
// means "something changed" and a healthy account reads calm. These thresholds are product calls,
// not engine facts: tune them here and the tests in tone.test.ts say what moved.
export type Tone = 'neutral' | 'warn' | 'alert'

/** Share of the included parses at which usage starts to warn. */
export const WARN_AT = 0.8

/** Success rate below this alerts. Refusals count as failures here, so a steady dip is worth a look. */
export const SUCCESS_FLOOR = 0.95

export function usageTone({
  parses,
  cap,
  overage,
}: {
  parses: number
  cap: number | null
  overage: number
}): Tone {
  if (cap === null) return 'neutral'
  if (overage > 0) return 'alert'
  return parses >= cap * WARN_AT ? 'warn' : 'neutral'
}

// The worker reports a 0 rate when nothing was attempted. That is "no data", not "everything failed".
export function successTone({ rate, attempts }: { rate: number; attempts: number }): Tone {
  if (attempts === 0) return 'neutral'
  return rate < SUCCESS_FLOOR ? 'alert' : 'neutral'
}

export function keysTone(activeKeys: number): Tone {
  return activeKeys === 0 ? 'warn' : 'neutral'
}

export function overageTone(overageParses: number): Tone {
  return overageParses > 0 ? 'alert' : 'neutral'
}
