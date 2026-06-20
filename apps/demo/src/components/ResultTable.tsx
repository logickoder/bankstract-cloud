// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import type { ParseResponse, Transaction } from '@bankstract/types'
import { useState } from 'react'

import { displayDate, displayMoney, displayNaira, signedNaira } from '../lib/format'
import { LINK_CLASS } from '../lib/styles'

import { Badge } from './ui/Badge'

const PREVIEW_ROWS = 10

const RECONCILED_TIP =
  'Row balances and statement totals both check out.'
const FALLBACK_TIP =
  "This statement doesn't ship per-row balances. We verified by matching debit + credit sums to the statement header. Same math, different proof."

export function ResultTable({ data }: { data: ParseResponse }) {
  const [expanded, setExpanded] = useState(false)
  const total = data.transactions.length
  const rows = expanded ? data.transactions : data.transactions.slice(0, PREVIEW_ROWS)
  const hasMore = total > PREVIEW_ROWS

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-bg-secondary">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4 text-sm">
        <span className="text-fg">{data.metadata?.bank ?? 'statement'}</span>
        {data.metadata?.account_number_masked ? (
          <span className="font-mono text-fg-secondary">{data.metadata.account_number_masked}</span>
        ) : null}
        <span className="text-fg-tertiary">
          {displayDate(data.metadata?.statement_period_start ?? null)} to{' '}
          {displayDate(data.metadata?.statement_period_end ?? null)}
        </span>
        <span className="ml-auto" title={data.row_wise_reconcilable ? RECONCILED_TIP : FALLBACK_TIP}>
          {data.row_wise_reconcilable ? (
            <Badge tone="accent">reconciled</Badge>
          ) : (
            <Badge tone="muted">unverified totals</Badge>
          )}
        </span>
      </div>

      {/* Desktop: full table. Hidden below sm where it would overflow. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
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
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={LINK_CLASS}
          >
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
