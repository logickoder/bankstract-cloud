// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// The "extract" brand mark for next/og (ImageResponse). Satori has no SVG path support, so the mark
// is positioned divs rather than the <svg> used in the DOM (packages/ui BrandMark). One lifted accent
// row pulled from a two-row stack sharing the left edge, on the bare 24x12 grid scaled to `width`.
// Stack colour varies by surface (dim on the favicon plate, muted on the large OG card), so callers
// pass it; the accent is brand-locked.
const ACCENT = '#D2691E'

// Bare 24x12 grid: [x, y, width]; height is fixed at 2.5. First row is the lifted accent.
const BARS: [number, number, number][] = [
  [5, 0, 14],
  [5, 5.5, 10],
  [5, 9.5, 10],
]
const BAR_H = 2.5

export function Mark({ width, stack }: { width: number; stack: string }) {
  const u = width / 24
  return (
    <div style={{ position: 'relative', display: 'flex', width, height: 12 * u }}>
      {BARS.map(([x, y, w], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            display: 'flex',
            left: x * u,
            top: y * u,
            width: w * u,
            height: BAR_H * u,
            borderRadius: (BAR_H / 2) * u,
            background: i === 0 ? ACCENT : stack,
          }}
        />
      ))}
    </div>
  )
}
