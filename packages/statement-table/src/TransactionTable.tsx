// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { displayDate, displayMoney, displayNaira, signedNaira } from '@bankstract/format'
import type { ParseResponse, Reconciliation, Transaction } from '@bankstract/types'
import { Badge, linkClass } from '@bankstract/ui'
import { useState } from 'react'

// Shared between @bankstract/demo's real parse result and @bankstract/marketing's generated
// sample statement on /for-lenders. Both render the same ParseResponse shape the same way;
// the only behavioral difference between the two call sites is row count (a real parse can
// run past PREVIEW_ROWS, a generated sample never does), and that difference is already
// handled by the same expand/collapse logic below with no extra prop needed.
const PREVIEW_ROWS = 10

// A statement that fails a check never renders (the worker returns a 422 ReconciliationError),
// so every reachable state here is at least one passed check. The engine also 422s when neither
// check can run; the last branch only exists because the type allows it.
function reconciliationCopy({ totals, row_wise, row_wise_reason }: Reconciliation) {
  if (row_wise === 'passed') {
    return {
      tone: 'accent',
      badge: 'reconciled',
      tip:
        totals === 'passed'
          ? 'Row balances and statement totals both check out.'
          : 'Row balances check out. Statement prints no totals.',
    } as const
  }
  if (totals === 'passed') {
    return {
      tone: 'accent',
      badge: 'reconciled (totals)',
      // A disabled row-wise check carries the parser's own reason, so the copy stays bank-agnostic.
      tip:
        row_wise === 'disabled'
          ? (row_wise_reason ?? 'Running balance does not chain row to row. Statement totals checked instead.')
          : 'No per-row balances on this statement. Debit and credit sums match the header.',
    } as const
  }
  return {
    tone: 'muted',
    badge: 'unverified',
    tip: 'No reconciliation check could run on this statement.',
  } as const
}

export function TransactionTable({ data }: { data: ParseResponse }) {
  const [expanded, setExpanded] = useState(false)
  const total = data.transactions.length
  const rows = expanded ? data.transactions : data.transactions.slice(0, PREVIEW_ROWS)
  const hasMore = total > PREVIEW_ROWS
  const reconciliation = reconciliationCopy(data.reconciliation)

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-bg-secondary">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-fg">{data.metadata?.bank ?? 'statement'}</span>
          {data.metadata?.account_number_masked ? (
            <span className="font-mono text-fg-secondary">
              {data.metadata.account_number_masked}
            </span>
          ) : null}
          <span className="text-fg-tertiary">
            {displayDate(data.metadata?.statement_period_start ?? null)} to{' '}
            {displayDate(data.metadata?.statement_period_end ?? null)}
          </span>
          <span className="ml-auto">
            <Badge tone={reconciliation.tone}>{reconciliation.badge}</Badge>
          </span>
        </div>
        {/* Explain the reconciliation badge inline; a title tooltip is invisible to keyboard + touch. */}
        <p className="mt-2 text-xs text-fg-tertiary">
          {reconciliation.tip}
        </p>
      </div>

      {/* Desktop: full table. Hidden below sm where it would overflow. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Parsed transactions from {data.metadata?.bank ?? 'the statement'}
          </caption>
          <thead>
            <tr className="text-left text-xs text-fg-tertiary">
              <th className="px-5 py-2 font-medium">DATE</th>
              <th className="px-5 py-2 font-medium">NARRATION</th>
              <th className="px-5 py-2 text-right font-medium">DEBIT</th>
              <th className="px-5 py-2 text-right font-medium">CREDIT</th>
              <th className="px-5 py-2 text-right font-medium">BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="px-5 py-2 whitespace-nowrap text-fg-secondary">
                  {displayDate(t.date)}
                </td>
                <td className="px-5 py-2 text-fg">{t.narration}</td>
                <td className="px-5 py-2 text-right font-mono whitespace-nowrap text-fg">
                  {displayMoney(t.debit)}
                </td>
                <td className="px-5 py-2 text-right font-mono whitespace-nowrap text-fg">
                  {displayMoney(t.credit)}
                </td>
                <td className="px-5 py-2 text-right font-mono whitespace-nowrap text-fg-secondary">
                  {displayMoney(t.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card per row. Date + signed amount, narration, then balance. */}
      <ul className="divide-y divide-border/50 sm:hidden">
        {rows.map((t, i) => (
          <MobileRow key={i} t={t} />
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs">
        {hasMore ? (
          <button type="button" onClick={() => setExpanded((v) => !v)} className={linkClass}>
            {expanded ? 'Show first 10' : `Show all ${total} rows`}
          </button>
        ) : (
          <span className="text-fg-tertiary">{total} transactions</span>
        )}
        <span className="font-mono text-fg-secondary">
          credit {displayNaira(data.totals.credit)} · debit {displayNaira(data.totals.debit)}
        </span>
      </div>
    </div>
  )
}

function MobileRow({ t }: { t: Transaction }) {
  const amount = signedNaira(t.debit, t.credit)
  return (
    <li className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-5 py-4">
      <span className="font-mono text-sm text-fg-secondary">{displayDate(t.date)}</span>
      <span
        className={`text-right font-mono text-sm ${amount.isCredit ? 'text-accent' : 'text-fg'}`}
      >
        {amount.text}
      </span>
      <span className="col-span-2 min-h-[1.25rem] text-sm text-fg-secondary">{t.narration}</span>
      {t.balance !== null ? (
        <span className="col-start-2 text-right font-mono text-xs text-fg-tertiary">
          balance {displayMoney(t.balance)}
        </span>
      ) : null}
    </li>
  )
}
