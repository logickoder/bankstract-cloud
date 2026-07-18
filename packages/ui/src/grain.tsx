// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Defines the #bs-grain SVG filter used by the `.grain-section` utility (theme.css).
// Render once per app, near the root. Static markup, no client boundary needed.
export function GrainFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden="true">
      {/* x/y/width/height pin the filter region to the element box. Without them SVG defaults to
          -10%..110%, so the grain bleeds ~10% past its .grain-section container. */}
      <filter id="bs-grain" x="0%" y="0%" width="100%" height="100%">
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
