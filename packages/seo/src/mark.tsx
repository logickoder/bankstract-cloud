// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// The "b" mark for next/og (ImageResponse): three short stem lines, one long shoulder line and two
// accent bowl lines, as in packages/ui BrandMark. Satori has no SVG path support here, so each row
// is a positioned div. Keep ROWS in step with that component. Accent is brand-locked per surface:
// callers pass the shade that is safe on their background.
// [x1, x2, accent?] per row, in a box 17 wide (x from -1) and 28 tall.
const ROWS: readonly (readonly [number, number, boolean])[] = [
  [0.4, 6.4, false],
  [0, 5.8, false],
  [0.5, 7, false],
  [-0.7, 15.2, false],
  [5, 14, true],
  [6.8, 11, true],
]
const BOX_W = 17
const BOX_H = 28

export function Mark({
  height,
  ink,
  accent,
  stroke = 3,
}: {
  height: number
  ink: string
  accent: string
  stroke?: number
}) {
  const u = height / BOX_H
  const pitch = (BOX_H - stroke) / (ROWS.length - 1)
  return (
    <div style={{ position: 'relative', display: 'flex', width: BOX_W * u, height }}>
      {ROWS.map(([x1, x2, isAccent], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            display: 'flex',
            left: (x1 + 1) * u,
            top: i * pitch * u,
            width: (x2 - x1) * u,
            height: stroke * u,
            borderRadius: (stroke / 2) * u,
            background: isAccent ? accent : ink,
          }}
        />
      ))}
    </div>
  )
}
