// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface DailyCount {
  date: string
  count: number
}

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
      <p className="font-mono text-fg-tertiary">{date}</p>
      <p className="mt-0.5 font-mono text-fg">
        {count.toLocaleString()} {count === 1 ? 'parse' : 'parses'}
      </p>
    </div>
  )
}

export function UsageChart({ daily }: { daily: DailyCount[] }) {
  const total = daily.reduce((sum, d) => sum + d.count, 0)
  const peak = daily.reduce((max, d) => Math.max(max, d.count), 0)
  return (
    <div>
      {/* The SVG carries no accessible content; a role=img label summarises it and the
          sr-only table below exposes the underlying data to assistive tech. */}
      <div
        role="img"
        aria-label={`Daily parses this cycle. ${total} total, peak ${peak} in one day.`}
      >
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={daily} barSize={12} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 11,
                fill: 'var(--color-fg-tertiary)',
                fontFamily: 'var(--font-mono)',
              }}
              tickLine={false}
              axisLine={false}
              // show first + last label only to avoid crowding
              tickFormatter={(v: string, i: number) => (i === 0 || i === daily.length - 1 ? v : '')}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'var(--color-bg-tertiary)', radius: 2 }}
            />
            <Bar dataKey="count" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
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
              <td>{d.date}</td>
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
