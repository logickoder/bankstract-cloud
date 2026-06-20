// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { SUPPORTED_BANKS } from '../lib/banks'

import { Badge } from './ui/Badge'

export function SupportedBanks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-fg-tertiary">
      <span>Supports</span>
      {SUPPORTED_BANKS.map((bank) => (
        <Badge key={bank} tone="accent">
          {bank}
        </Badge>
      ))}
    </div>
  )
}
