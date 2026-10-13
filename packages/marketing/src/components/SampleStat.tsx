// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Badge, Button } from '@bankstract/ui'

import { rerollSample, useSample } from '../lib/use-sample'

export function SampleStat() {
  const { closing } = useSample()
  return (
    <div className="min-w-0 lg:text-right">
      <p className="text-xs text-fg-tertiary">Sample parse. Synthetic data.</p>
      <p className="mt-2 font-mono text-[clamp(2rem,4.2vw,3.75rem)] leading-none tracking-[-0.04em] whitespace-nowrap text-fg">
        <span aria-hidden="true">&#8358;</span>
        {closing}
      </p>
      <div className="mt-4 flex items-center gap-3 lg:justify-end">
        <Badge>Reconciled</Badge>
        <span className="font-mono text-sm text-fg-secondary">closing balance</span>
        <Button type="button" variant="ghost" size="sm" onClick={rerollSample}>
          New sample
        </Button>
      </div>
    </div>
  )
}
