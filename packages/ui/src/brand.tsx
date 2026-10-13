// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { SVGProps } from 'react'

import { cn } from './lib/cn'

// The mark is the letter "b" drawn as statement rows: three short stem lines, one long line (the
// shoulder), and two accent lines stepped in under it (the bowl, left open). It stands in for the
// first letter of the name, so the logo is <Wordmark/>: [mark]ankstract. Rows are evenly spaced and
// the last sits on the baseline. The x ranges are loose on purpose, like a hand-drawn row stack.
// Keep in step with packages/seo/src/mark.tsx and the icon.svg files, which cannot import this.
// [x1, x2, accent?] per row, in a 28-unit tall box.
const ROWS: readonly (readonly [number, number, boolean])[] = [
  [0.4, 6.4, false],
  [0, 5.8, false],
  [0.5, 7, false],
  [-0.7, 15.2, false],
  [5, 14, true],
  [6.8, 11, true],
]
const HEIGHT = 28
// Stroke in box units. 3 holds at header size (about 1.9px at 24px type, close to the serif's own
// stems); the favicon is a separate drawing (icon.svg).
const STROKE = 3
const PITCH = (HEIGHT - STROKE) / (ROWS.length - 1)

// Stem and shoulder follow the text colour. The two bowl lines take the accent shade that is safe
// for the surface (var(--color-accent-text)), so the mark reads on paper and on ink.
export function BrandMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="-1 0 17 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {ROWS.map(([x1, x2, accent], i) => (
        <rect
          key={i}
          x={x1}
          y={i * PITCH}
          width={x2 - x1}
          height={STROKE}
          rx={STROKE / 2}
          fill={accent ? 'var(--color-accent-text)' : 'currentColor'}
        />
      ))}
    </svg>
  )
}

// [mark]ankstract. Sized in em, so set a text size class and it scales. Flex baseline alignment
// puts the bottom of the svg on the text baseline, and the mark is as tall as the ascender. Screen
// readers hear "bankstract": the sr-only b stands in for the drawn one.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-display leading-none font-bold tracking-[-0.02em]',
        className,
      )}
    >
      <BrandMark className="mr-[0.04em] h-[0.74em] w-auto" />
      <span className="sr-only">b</span>
      <span>ankstract</span>
    </span>
  )
}
