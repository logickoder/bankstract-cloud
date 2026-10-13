// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'

// Drawn graphics. All SVG + theme tokens, so a theme swap re-colors them and nothing ships as a
// raster. Decorative: aria-hidden, the surrounding copy carries the meaning. Synthetic content only.

// Skeleton rows on the sheet: [narration width, highlighted].
const SHEET_ROWS: readonly (readonly [number, boolean])[] = [
  [96, false],
  [70, true],
  [84, true],
  [60, true],
  [100, false],
  [76, false],
  [88, false],
  [64, false],
]

export function StatementSheet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 310" className={cn('w-full', className)} aria-hidden="true">
      <rect width="240" height="310" rx="10" className="fill-sheet" />
      <rect x="24" y="24" width="84" height="10" rx="2" className="fill-sheet-ink" />
      <rect x="24" y="40" width="56" height="6" rx="2" className="fill-sheet-ink/35" />
      {/* Redacted account number: the privacy half of the product, drawn. */}
      <rect x="24" y="62" width="112" height="12" rx="2" className="fill-sheet-ink" />
      <rect x="24" y="92" width="192" height="1" className="fill-sheet-ink/20" />
      {SHEET_ROWS.map(([width, hit], i) => {
        const y = 108 + i * 22
        return (
          <g key={i}>
            {hit ? (
              <rect x="16" y={y - 7} width="208" height="20" rx="4" className="fill-accent/20" />
            ) : null}
            <rect x="24" y={y} width="34" height="6" rx="2" className="fill-sheet-ink/30" />
            <rect x="70" y={y} width={width} height="6" rx="2" className="fill-sheet-ink/55" />
            <rect x="176" y={y} width="40" height="6" rx="2" className="fill-sheet-ink/55" />
          </g>
        )
      })}
    </svg>
  )
}

// Three transactions leaving the sheet toward the tiles.
export function FlowLines({ className }: { className?: string }) {
  const paths = [
    'M0 70 C 60 70, 60 40, 120 40',
    'M0 100 C 60 100, 60 100, 120 100',
    'M0 130 C 60 130, 60 160, 120 160',
  ]
  return (
    <svg viewBox="0 0 120 200" className={cn('w-full', className)} aria-hidden="true">
      {paths.map((d) => (
        <path key={d} d={d} fill="none" strokeWidth="1.5" className="stroke-accent" strokeDasharray="3 5" />
      ))}
      {[40, 100, 160].map((cy) => (
        <circle key={cy} cx="120" cy={cy} r="4" className="fill-accent" />
      ))}
    </svg>
  )
}

// Self-host: engine feeds worker feeds demo, the stack in infra/.
export function StackGraphic({ className }: { className?: string }) {
  const layers: readonly (readonly [string, string])[] = [
    ['bankstract engine', 'MIT'],
    ['worker', 'AGPL-3.0'],
    ['demo', 'AGPL-3.0'],
  ]
  return (
    <svg viewBox="0 0 280 210" className={cn('w-full', className)} aria-hidden="true">
      {layers.map(([name, license], i) => {
        const y = 8 + i * 68
        return (
          <g key={name}>
            <rect x="4" y={y} width="272" height="52" rx="10" className={i === 1 ? 'fill-accent/15 stroke-accent' : 'fill-bg-secondary stroke-border'} strokeWidth="1.5" />
            <text x="24" y={y + 31} className="fill-fg font-mono text-[14px]">{name}</text>
            <text x="256" y={y + 31} textAnchor="end" className="fill-fg-secondary font-mono text-[11px]">{license}</text>
            {i < layers.length - 1 ? (
              <path d={`M140 ${y + 52} v16`} strokeWidth="1.5" className="stroke-fg-tertiary" strokeDasharray="3 3" />
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
