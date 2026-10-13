// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { SUPPORTED_BANKS } from '../lib/banks'

export function SupportedBanks() {
  return (
    <p className="font-mono text-sm text-fg-tertiary">Live: {SUPPORTED_BANKS.join(', ')}</p>
  )
}
