// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { TransactionTable } from '@bankstract/statement-table'
import { Button } from '@bankstract/ui'
import { useState } from 'react'

import { generateSampleStatement } from '../lib/sample-statement'

import { DEFAULT_THRESHOLD, SampleScoreCard } from './SampleScoreCard'

// Thin client shell holding only interactive state (which generated sample is shown, the
// visitor's own threshold), same shape as Tabs.tsx, the existing precedent for a stateful
// component in this package. The threshold survives a Shuffle; only the sample data changes.
//
// Safe to generate the first sample directly in the initializer: SampleStatementPanelLoader
// mounts this via next/dynamic({ssr:false}), so it never runs server-side and there is no
// server/client Math.random() mismatch to guard against here.
export function SampleStatementPanel() {
  const [data, setData] = useState(() => generateSampleStatement())
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setData(generateSampleStatement())}>
          Shuffle
        </Button>
      </div>
      <TransactionTable data={data} />
      <SampleScoreCard data={data} threshold={threshold} onThresholdChange={setThreshold} />
    </div>
  )
}
