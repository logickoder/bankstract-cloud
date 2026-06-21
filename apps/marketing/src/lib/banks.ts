// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Coverage data. SHIPPED mirrors the engine's list_parsers() (bankstract 0.13), lowercase
// as the engine reports. ROADMAP is the public roadmap: `next` = in active development,
// `planned` = wanted. Directive 6: the coverage grid renders from this data, never a
// hardcoded list inside the component. Keep SHIPPED in sync with the engine; never claim a
// bank the engine cannot parse, and never list a non-Nigerian institution here.
export interface BankEntry {
  id: string
  status: 'shipped' | 'next' | 'planned'
}

export const SHIPPED_BANKS: readonly BankEntry[] = [
  { id: 'fbn', status: 'shipped' },
  { id: 'opay', status: 'shipped' },
  { id: 'palmpay', status: 'shipped' },
  { id: 'zenith', status: 'shipped' },
]

export const ROADMAP_BANKS: readonly BankEntry[] = [
  { id: 'gtb', status: 'next' },
  { id: 'kuda', status: 'next' },
  { id: 'sparkle', status: 'planned' },
  { id: 'alat', status: 'planned' },
  { id: 'stanbic', status: 'planned' },
]

export const ALL_BANKS: readonly BankEntry[] = [...SHIPPED_BANKS, ...ROADMAP_BANKS]
