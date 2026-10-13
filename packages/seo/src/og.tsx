// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ImageResponse } from 'next/og'

import { Mark } from './mark'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

// The site's paper surface (packages/ui/src/theme.css), so a shared link looks like the page it
// points at. ACCENT is the AA-safe shade for text on paper. TINTS echo the landing's tile rows.
const BG = '#fcfbf9'
const FG = '#14161f'
const MUTED = '#4f5360'
const ACCENT = '#a8500f'
const TINTS = ['#dfe98f', '#ffe27a', '#ffcfa8', '#e5dcff']

interface OgInput {
  /** Headline first line (foreground). */
  line1: string
  /** Headline second line (accent colour). */
  line2: string
  /** Supporting subtitle (muted). */
  subtitle: string
}

// Serve a card from a route handler mounted at `<segment>/og/route.tsx`, and point buildMetadata's
// `ogImage` at that same `/og` path. This is deliberately NOT Next's opengraph-image.tsx file
// convention, which looks simpler but breaks two ways here:
//
//   1. Shadowing. The convention attaches og:image to the metadata of the segment the file lives
//      in. Metadata merges per-field top-down, so a leaf page that exports its own `openGraph`
//      (every page does, via buildMetadata) REPLACES the ancestor's whole openGraph object and
//      drops the inherited image. Result: any route whose card sits on a parent segment silently
//      renders no preview. Carrying the path inside buildMetadata's openGraph immunises it — the
//      image rides in the object that wins.
//   2. Unnameable URL. The convention appends a build hash to nested cards (/pricing/opengraph-
//      image-15m7k7), and the clean path 404s in a server build. You can't write that hash into
//      openGraph.images by hand. A route handler serves a fixed, referenceable path.
//
// Exception: apps/docs is a static export, where the file convention prerenders to a clean static
// file — so docs keeps opengraph-image.tsx and points `ogImage` at /docs/opengraph-image.
// Return the global Response (ImageResponse extends it) so consumers can name the type without
// reaching into this package's nested next/og (TS2742).
export function ogRoute(input: OgInput): { GET: () => Response } {
  return { GET: () => ogImage(input) }
}

// The shared 1200x630 social card: brand mark + wordmark header, two-line headline (the second
// line accented), a muted subtitle, and a row of the four tint tiles. Each surface supplies only the copy.
export function ogImage({ line1, line2, subtitle }: OgInput): Response {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BG,
          padding: 72,
          color: FG,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Mark width={64} stack={FG} />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>bankstract</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 70, fontWeight: 800, lineHeight: 1.08 }}>
            {line1}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 70,
              fontWeight: 800,
              lineHeight: 1.08,
              color: ACCENT,
            }}
          >
            {line2}
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: MUTED }}>
            {subtitle}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          {TINTS.map((tint) => (
            <div
              key={tint}
              style={{ display: 'flex', flex: 1, height: 56, borderRadius: 16, background: tint }}
            />
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
