// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Badge } from '@bankstract/ui'

import type { BankEntry } from '../lib/banks'

// One coverage cell. Bank id is lowercase + mono (voice rule). Status reads from the
// engine-truth data, not the component (Directive 6).
export function BankCoverageCell({ entry }: { entry: BankEntry }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-bg-secondary px-4 py-3">
      <span className="font-mono text-sm text-fg">{entry.id}</span>
      {entry.status === 'shipped' ? (
        <Badge tone="accent">live</Badge>
      ) : (
        <Badge tone="muted">{entry.target ? `v${entry.target}` : 'planned'}</Badge>
      )}
    </div>
  )
}
