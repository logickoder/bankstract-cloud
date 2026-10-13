// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'
import type { ReactNode } from 'react'

import { SHIPPED_BANKS } from '../lib/banks'
import { CODE_SAMPLES } from '../lib/code-samples'

import { CodeBlock } from './CodeBlock'
import { SampleRows } from './SampleRows'
import { PAGE_CONTAINER, SectionHeading } from './Section'
import { Tabs } from './Tabs'
import { ReconcileTile, RedactTile } from './bento-tiles'
import { StatementSheet } from './graphics'

// One tile grid in the hero's pastel language (replaces the stats row, the code section and the
// three feature cards). Every figure traces to code: bank count to lib/banks.ts (engine
// list_parsers), 50 MB to max_upload_bytes in apps/worker config.py, zero disk writes to the
// privacy rule. No invented numbers (DESIGN: stats real or omitted).

function Tile({
  className,
  tone,
  children,
}: {
  className?: string
  tone: 'pastel' | 'quiet'
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-lg p-5 sm:p-6',
        tone === 'pastel' ? 'text-sheet-ink' : 'border border-border bg-bg-secondary text-fg',
        className,
      )}
    >
      {children}
    </div>
  )
}

function TileTitle({ children, soft = false }: { children: ReactNode; soft?: boolean }) {
  return (
    <h3
      className={cn(
        'font-display text-3xl font-semibold tracking-[-0.02em]',
        soft ? 'text-fg' : 'text-sheet-ink',
      )}
    >
      {children}
    </h3>
  )
}

function Stat({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <Tile tone="quiet" className={cn('justify-between gap-6', className)}>
      <p className="font-mono text-5xl tracking-[-0.04em] sm:text-6xl">{value}</p>
      <p className="text-sm text-fg-secondary">{label}</p>
    </Tile>
  )
}

export function Bento() {
  const codeItems = CODE_SAMPLES.map((sample) => ({
    label: sample.label,
    panel: <CodeBlock code={sample.code} lang={sample.lang} />,
  }))

  return (
    <section className={cn('py-12 sm:py-20', PAGE_CONTAINER)}>
      <SectionHeading>Parse. Redact. Reconcile.</SectionHeading>
      <p className="mt-3 mb-10 max-w-xl text-xl text-fg">
        Built for lenders, bookkeeping tools and tax-prep apps. Anywhere a Nigerian bank statement
        has to become data.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Tile tone="pastel" className="bg-tint-1 sm:col-span-2 lg:col-span-4 lg:row-span-2">
          <TileTitle>Parse</TileTitle>
          <p className="mt-2 max-w-md text-sheet-ink/70">
            Statement PDF in. Structured JSON out: transactions, balances, account metadata. One
            endpoint. One contract.
          </p>
          <div className="mt-6 flex items-end gap-5">
            <div className="w-28 shrink-0 overflow-hidden rounded-md border border-sheet-ink/15 sm:w-32">
              <StatementSheet />
            </div>
            <SampleRows />
          </div>
        </Tile>
        <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1 lg:row-span-2">
          <Stat value={String(SHIPPED_BANKS.length)} label="banks parse today" />
          <Stat value="50 MB" label="max PDF size per upload" />
        </div>

        <Tile tone="pastel" className="bg-tint-2 lg:col-span-2">
          <TileTitle>Redact</TileTitle>
          <p className="mt-2 mb-5 text-sm text-sheet-ink/70">
            Names, account numbers and BVN masked in the same API. Get the redacted PDF back.
          </p>
          <RedactTile />
        </Tile>
        <Tile tone="pastel" className="bg-tint-4 lg:col-span-2">
          <TileTitle>Reconcile</TileTitle>
          <p className="mt-2 mb-5 text-sm text-sheet-ink/70">
            Balances and totals are checked on every parse. A mismatch returns an error with the
            reason, never a wrong number.
          </p>
          <ReconcileTile />
        </Tile>
        <Stat value="0" label="statement files written to disk" className="lg:col-span-2" />

        <div className="surface-ink rounded-xl p-4 sm:col-span-2 sm:p-6 lg:col-span-6">
          <p className="mb-4 text-sm text-fg-secondary">
            One call. curl, Python, TypeScript or Go. The same JSON back every time.
          </p>
          <Tabs items={codeItems} />
        </div>
      </div>
    </section>
  )
}
