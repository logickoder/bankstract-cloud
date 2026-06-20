// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ReactNode } from 'react'

type Tone = 'accent' | 'muted'

const TONES: Record<Tone, string> = {
  accent: 'bg-accent-muted text-accent',
  muted: 'bg-bg-tertiary text-fg-secondary border border-border',
}

export function Badge({ tone = 'muted', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}>{children}</span>
  )
}
