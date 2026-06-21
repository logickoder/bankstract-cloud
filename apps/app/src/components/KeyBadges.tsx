// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Badge } from '@bankstract/ui'

export function EnvBadge({ env }: { env: string }) {
  return <Badge tone={env === 'live' ? 'accent' : 'muted'}>{env}</Badge>
}

export function StatusBadge({ revoked }: { revoked: boolean }) {
  return revoked ? <Badge tone="error">revoked</Badge> : <Badge tone="success">active</Badge>
}
