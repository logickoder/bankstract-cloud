// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { displayDate } from '@bankstract/format'
import { cn } from '@bankstract/ui'

import type { DailyCount } from '@/lib/usage-stats'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const

// Shade by share of the busiest day, so the grid reads the same at 20 parses or 20,000. Level 0 is
// an empty day. Ink, not the accent: the accent marks only the busiest day. Mixed with transparency
// so a theme swap re-colors it.
const LEVELS = [
  'bg-bg-tertiary',
  'bg-[color-mix(in_srgb,var(--color-fg)_14%,transparent)]',
  'bg-[color-mix(in_srgb,var(--color-fg)_30%,transparent)]',
  'bg-[color-mix(in_srgb,var(--color-fg)_52%,transparent)]',
  'bg-[color-mix(in_srgb,var(--color-fg)_74%,transparent)]',
] as const

function level(count: number, peak: number): number {
  if (count <= 0 || peak <= 0) return 0
  const share = count / peak
  if (share <= 0.25) return 1
  if (share <= 0.5) return 2
  if (share <= 0.75) return 3
  return 4
}

function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`)
}

// Monday-first offset of a date (0 = Monday).
function weekdayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

// One month-style grid: 7 columns (Mon to Sun), one row per week, leading blanks to align the first
// day. A server component: no chart library, and each cell carries its own accessible label.
export function UsageCalendar({ daily }: { daily: DailyCount[] }) {
  const peak = daily.reduce((max, d) => Math.max(max, d.count), 0)
  const first = daily[0]
  const lead = first ? weekdayIndex(parse(first.date)) : 0
  const cells: (DailyCount | null)[] = [...Array<null>(lead).fill(null), ...daily]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] text-fg-tertiary">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <ol className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) =>
          cell ? (
            <li
              key={cell.date}
              title={`${displayDate(cell.date)}: ${cell.count.toLocaleString()} ${cell.count === 1 ? 'parse' : 'parses'}`}
              className={cn(
                'flex h-11 items-start rounded-md p-1.5 font-mono text-[10px]',
                peak > 0 && cell.count === peak
                  ? 'bg-accent text-accent-fg'
                  : cn(LEVELS[level(cell.count, peak)], level(cell.count, peak) === 4 ? 'text-bg' : 'text-fg'),
              )}
            >
              <span aria-hidden="true">{Number(cell.date.slice(8, 10))}</span>
              <span className="sr-only">
                {displayDate(cell.date)}: {cell.count} {cell.count === 1 ? 'parse' : 'parses'}
              </span>
            </li>
          ) : (
            <li key={`blank-${i}`} aria-hidden="true" className="h-11" />
          ),
        )}
      </ol>
      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-fg-tertiary">
        less
        {LEVELS.map((cls) => (
          <span key={cls} aria-hidden="true" className={cn('size-3 rounded-sm', cls)} />
        ))}
        more
        <span aria-hidden="true" className="ml-2 size-3 rounded-sm bg-accent" />
        busiest
      </div>
    </div>
  )
}

// Empty state: the same grid, muted, so the page does not jump when the first parse lands.
export function UsageCalendarSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }, (_, i) => (
          <span key={i} className="h-11 rounded-md bg-bg-tertiary/60" />
        ))}
      </div>
    </div>
  )
}
