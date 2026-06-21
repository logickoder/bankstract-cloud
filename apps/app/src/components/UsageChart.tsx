// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Minimal daily-parses bar chart. Pure CSS (no chart dep), one bar per day.
export function UsageChart({ daily }: { daily: { date: string; count: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.count))
  return (
    <div>
      <div
        className="flex h-40 items-end gap-1 border-b border-border"
        role="img"
        aria-label="Daily parses this cycle"
      >
        {daily.map((d) => (
          <div
            key={d.date}
            className="flex h-full flex-1 items-end"
            title={`${d.date}: ${d.count}`}
          >
            <div
              className="w-full rounded-t-sm bg-accent transition-[height]"
              style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-fg-tertiary">
        <span>{daily[0]?.date}</span>
        <span>{daily[daily.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// Empty-state skeleton: same frame as UsageChart, muted bars, caption overlay.
// Shows the shape of what lands once the first parse comes in.
const SKELETON_BARS = [18, 32, 24, 44, 30, 52, 38, 60, 46, 34, 50, 40, 56, 28]

export function UsageChartSkeleton({ label }: { label: string }) {
  return (
    <div className="relative">
      <div className="flex h-40 items-end gap-1 border-b border-border" aria-hidden="true">
        {SKELETON_BARS.map((h, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div className="w-full rounded-t-sm bg-bg-tertiary" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md bg-bg/70 px-3 py-1 text-sm text-fg-tertiary backdrop-blur-sm">
          {label}
        </span>
      </div>
    </div>
  )
}
