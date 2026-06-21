// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { getUserId } from './session'
import { type KeyInfo, type OwnerUsage, workerFetch } from './worker'

// Server-side reads for the dashboard pages. The worker is the source of truth; we never
// cache key/usage data in the app.
export async function fetchKeys(): Promise<KeyInfo[]> {
  const owner = await getUserId()
  if (!owner) return []
  try {
    const res = await workerFetch(`/v1/keys?owner=${encodeURIComponent(owner)}`)
    if (!res.ok) return []
    const { keys } = (await res.json()) as { keys: KeyInfo[] }
    return keys
  } catch {
    // worker unreachable: render an empty state rather than crash the page.
    return []
  }
}

export async function fetchUsage(): Promise<OwnerUsage | null> {
  const owner = await getUserId()
  if (!owner) return null
  try {
    const res = await workerFetch(`/v1/admin/usage?owner=${encodeURIComponent(owner)}`)
    if (!res.ok) return null
    return (await res.json()) as OwnerUsage
  } catch {
    return null
  }
}
