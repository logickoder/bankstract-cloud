// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { displayDate, displayDay } from '@bankstract/format'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { type DailyCount, summarize } from '@/lib/usage-stats'

interface TooltipPayload {
  value: number
  payload: DailyCount
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayload[]
}) {
  if (!active || !payload?.length) return null
  const { date, count } = payload[0]!.payload
  return (
    <div className="rounded-md border border-border bg-bg px-3 py-2 text-xs shadow-md">
      <p className="font-mono text-fg-tertiary">{displayDate(date)}</p>
      <p className="mt-0.5 font-mono text-fg">
        {count.toLocaleString()} {count === 1 ? 'parse' : 'parses'}
      </p>
    </div>
  )
}

export function UsageChart({ daily }: { daily: DailyCount[] }) {
  const { total, peak: busiest } = summarize(daily)
  const peak = busiest?.count ?? 0
  return (
    <div>
      {/* The SVG carries no accessible content; a role=img label summarises it and the
          sr-only table below exposes the underlying data to assistive tech. */}
      <div
        role="img"
        aria-label={`Daily parses this cycle. ${total} total, peak ${peak} in one day.`}
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={daily} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 11,
                fill: 'var(--color-fg-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
              tickLine={false}
              axisLine={false}
              // Always label the first and last day, and as many in between as fit without touching.
              interval="preserveStartEnd"
              minTickGap={14}
              padding={{ left: 4, right: 20 }}
              tickFormatter={displayDay}
            />
            <YAxis
              allowDecimals={false}
              width={40}
              tickCount={4}
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
                fill: 'var(--color-fg-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'var(--color-bg-tertiary)', radius: 2 }}
            />
            {/* Ink, not the accent: the accent is for links and small marks, and thirty orange bars
                were the loudest thing on the page. Only the busiest day keeps it. */}
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={22}>
              {daily.map((d) => (
                <Cell
                  key={d.date}
                  fill={peak > 0 && d.count === peak ? 'var(--color-accent)' : 'var(--color-fg)'}
                  fillOpacity={peak > 0 && d.count === peak ? 1 : 0.62}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Daily parses this cycle</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Parses</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}>
              <td>{displayDate(d.date)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Empty-state skeleton: same frame, muted bars, caption overlay.
const SKELETON_BARS: DailyCount[] = [18, 32, 24, 44, 30, 52, 38, 60, 46, 34, 50, 40, 56, 28].map(
  (count, i) => ({ date: String(i), count }),
)

export function UsageChartSkeleton({ label }: { label: string }) {
  return (
    <div className="relative">
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={SKELETON_BARS}
            barSize={12}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          >
            <YAxis hide allowDecimals={false} />
            <Bar dataKey="count" fill="var(--color-bg-tertiary)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md bg-bg/70 px-3 py-1 text-sm text-fg-tertiary backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  )
}
