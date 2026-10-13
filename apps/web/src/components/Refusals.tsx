// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Card } from '@bankstract/ui'

import { Meter } from '@/components/Meter'
import type { RefusalCount } from '@/lib/worker'

// The error_class values the worker records (engine errors, reconciliation, processing limits).
// Anything else renders under its raw class name, so a new class is visible before it has copy.
const REASONS: Record<string, { label: string; hint?: string }> = {
  ReconciliationError: {
    label: 'Totals did not match',
    hint: 'The rows did not add up to the statement. Refused, not guessed.',
  },
  LayoutDriftError: { label: 'Layout changed', hint: 'The bank changed its statement layout.' },
  EmptyStatementError: { label: 'No transactions found' },
  EncryptedSourceError: { label: 'Password-protected PDF', hint: 'The file is encrypted.' },
  ParseError: { label: 'Could not read the statement' },
  UnknownFormat: { label: 'Bank not recognised' },
  ResourceLimitError: {
    label: 'Over processing limits',
    hint: 'The file hit the time or memory limit.',
  },
  ReportShapeError: { label: 'Report unreadable' },
  unknown: { label: 'Reason not recorded' },
}

export function totalRefused(refusals: RefusalCount[]): number {
  return refusals.reduce((sum, r) => sum + r.count, 0)
}

// Failed parses this cycle, by reason. This is the "fails loud" promise made visible in the
// product: a statement that cannot be verified is refused with a reason, and here is how often.
export function Refusals({ refusals }: { refusals: RefusalCount[] }) {
  const total = totalRefused(refusals)
  const peak = refusals.reduce((max, r) => Math.max(max, r.count), 0)
  return (
    <Card id="refusals" className="mt-3 scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-fg">Refused this cycle</h2>
        <p className="font-mono text-xs text-fg-tertiary">
          {total.toLocaleString()} {total === 1 ? 'statement' : 'statements'}
        </p>
      </div>
      <p className="mt-1 text-sm text-fg-secondary">
        When bankstract cannot verify a statement it stops and says why. Failed parses are never
        counted or billed.
      </p>
      {refusals.length === 0 ? (
        <p className="mt-5 text-sm text-fg-tertiary">No refusals this cycle.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {refusals.map((r) => {
            const reason = REASONS[r.error_class]
            return (
              <li key={r.error_class}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-fg">
                    {reason?.label ?? 'Other'}{' '}
                    <span className="font-mono text-xs text-fg-tertiary">{r.error_class}</span>
                  </span>
                  <span className="font-mono text-sm text-fg">{r.count.toLocaleString()}</span>
                </div>
                <Meter
                  percent={peak > 0 ? Math.max(4, Math.round((r.count / peak) * 100)) : 0}
                  className="mt-1.5 h-1.5"
                  trackClassName="bg-bg-tertiary"
                  fillClassName="bg-fg/60"
                />
                {reason?.hint ? (
                  <p className="mt-1.5 text-xs text-fg-tertiary">{reason.hint}</p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
