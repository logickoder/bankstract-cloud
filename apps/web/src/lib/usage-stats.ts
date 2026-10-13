// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

export interface DailyCount {
  date: string
  count: number
}

export function summarize(daily: DailyCount[]): {
  total: number
  peak: DailyCount | null
  average: number
  activeDays: number
} {
  const total = daily.reduce((sum, d) => sum + d.count, 0)
  const peak = daily.reduce<DailyCount | null>((best, d) => (!best || d.count > best.count ? d : best), null)
  return {
    total,
    peak: peak && peak.count > 0 ? peak : null,
    average: daily.length ? Math.round(total / daily.length) : 0,
    activeDays: daily.filter((d) => d.count > 0).length,
  }
}
