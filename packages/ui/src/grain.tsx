// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Defines the #bs-grain SVG filter used by the `.grain-section` utility (theme.css).
// Render once per app, near the root. Static markup, no client boundary needed.
export function GrainFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      <filter id="bs-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves={4}
          stitchTiles="stitch"
        />
      </filter>
    </svg>
  )
}
