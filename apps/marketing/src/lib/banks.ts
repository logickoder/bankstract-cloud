// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Coverage data. SHIPPED mirrors the engine's list_parsers() (bankstract 0.13), lowercase
// as the engine reports. PLANNED is the public roadmap. Directive 6: the coverage grid
// renders from this data, never a hardcoded list inside the component. Keep SHIPPED in
// sync with the engine; never claim a bank the engine cannot parse.
export interface BankEntry {
  id: string
  status: 'shipped' | 'planned'
  target?: string
}

export const SHIPPED_BANKS: readonly BankEntry[] = [
  { id: 'fbn', status: 'shipped' },
  { id: 'opay', status: 'shipped' },
  { id: 'palmpay', status: 'shipped' },
  { id: 'zenith', status: 'shipped' },
]

export const PLANNED_BANKS: readonly BankEntry[] = [
  { id: 'gtb', status: 'planned', target: '0.14' },
  { id: 'kuda', status: 'planned', target: '0.15' },
  { id: 'sparkle', status: 'planned' },
  { id: 'alat', status: 'planned' },
  { id: 'stanbic', status: 'planned' },
  { id: 'wise', status: 'planned' },
]

export const ALL_BANKS: readonly BankEntry[] = [...SHIPPED_BANKS, ...PLANNED_BANKS]
