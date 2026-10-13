// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { SampleTiles } from './SampleTiles'
import { FlowLines, StatementSheet } from './graphics'

// Signature element (DESIGN hero-transformation), drawn and set on the hero surface: a statement
// sheet is read by a scan-line, three transactions leave it and land as tiles.
export function StatementFlow() {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[clamp(9rem,26svh,14rem)_5rem_1fr]">
      <div className="relative mx-auto w-48 max-w-full rotate-[-2deg] overflow-hidden rounded-[10px] border border-border shadow-sm lg:w-full">
        <StatementSheet />
        <div className="scan-line pointer-events-none absolute inset-0" aria-hidden="true" />
      </div>
      <FlowLines className="hidden lg:block" />
      <div className="min-w-0">
        <div className="mb-4 flex gap-2" aria-hidden="true">
          <span className="h-3 w-28 rounded-full bg-bg-tertiary" />
          <span className="h-3 w-16 rounded-full bg-bg-tertiary/70" />
          <span className="h-3 w-10 rounded-full bg-bg-tertiary/40" />
        </div>
        <SampleTiles />
      </div>
    </div>
  )
}
