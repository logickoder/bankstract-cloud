// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ReactNode, SVGProps } from 'react'

// The five brand-critical glyphs (DESIGN §anti-ai-required: hand-drawn, not Lucide). One visual
// family built from the BrandMark "extract / lifted-row" motif: statements are stacks of rows, and
// bankstract lifts structure out of them. Stroke-based on currentColor so `text-accent` drives the
// colour exactly like the Lucide icons they replace (same 24 grid, same footprint). Utility icons
// (nav, settings, social) stay Lucide.

function IconBase({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

// Parse: a row lifted out of the document and carried off to the right (the core extract move).
export function ParseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="4" width="10.5" height="16" rx="1.5" />
      <path d="M6.5 9h5" />
      <path d="M6.5 12.5h3" />
      <path d="M12.5 16.5H20" />
      <path d="M17.5 14l2.5 2.5-2.5 2.5" />
    </IconBase>
  )
}

// Redact: rows of text, one replaced in place by a solid mask bar.
export function RedactIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 7.5h16" />
      <rect x="4" y="10.75" width="11" height="2.5" rx="0.75" fill="currentColor" stroke="none" />
      <path d="M4 16.5h13" />
    </IconBase>
  )
}

// Reconcile: two sides that balance (equals) and check out.
export function ReconcileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 9.5h7" />
      <path d="M4 13.5h7" />
      <path d="M13.5 12.5l2.5 2.5 4.5-5.5" />
    </IconBase>
  )
}

// Api key: the bow formed from the bracket-pair, a toothed shaft.
export function ApiKeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="7" cy="12" r="3.75" />
      <path d="M10.75 12H20" />
      <path d="M16.5 12v3.25" />
      <path d="M19.5 12v2.5" />
    </IconBase>
  )
}

// Usage: three ascending bars off a baseline (echoes the dashboard UsageChart).
export function UsageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 20h16" />
      <path d="M6.5 20v-6" />
      <path d="M12 20V9.5" />
      <path d="M17.5 20V5" />
    </IconBase>
  )
}
