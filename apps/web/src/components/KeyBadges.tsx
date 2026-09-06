// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Badge } from '@bankstract/ui'

export function TierBadge({ tier }: { tier: string }) {
  return <Badge tone={tier === 'live' ? 'accent' : 'muted'}>{tier}</Badge>
}

export function StatusBadge({ revoked }: { revoked: boolean }) {
  return revoked ? <Badge tone="error">revoked</Badge> : <Badge tone="success">active</Badge>
}
