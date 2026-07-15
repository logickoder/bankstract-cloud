// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { getUserId } from './session'
import {
  type KeyInfo,
  type OwnerUsage,
  type SubscriptionStatusResponse,
  workerFetch,
} from './worker'

// `null` means "no signed-in owner yet" (the layout gates auth); a genuine worker failure
// (timeout, connection refused, non-2xx) throws so the dashboard's error.tsx boundary catches
// it and shows a real error state instead of masquerading as empty data.
async function ownerFetch<T>(path: (owner: string) => string): Promise<T | null> {
  const owner = await getUserId()
  if (!owner) return null
  const res = await workerFetch(path(owner))
  if (!res.ok) throw new Error(`worker request failed (${res.status})`)
  return (await res.json()) as T
}

export async function fetchKeys(): Promise<KeyInfo[]> {
  const data = await ownerFetch<{ keys: KeyInfo[] }>(
    (o) => `/v1/keys?owner=${encodeURIComponent(o)}`,
  )
  return data?.keys ?? []
}

export async function fetchUsage(): Promise<OwnerUsage | null> {
  return ownerFetch<OwnerUsage>((o) => `/v1/admin/usage?owner=${encodeURIComponent(o)}`)
}

export async function fetchBillingStatus(): Promise<SubscriptionStatusResponse | null> {
  return ownerFetch<SubscriptionStatusResponse>(
    (o) => `/v1/admin/billing/status?owner=${encodeURIComponent(o)}`,
  )
}

export function hasUsageData(usage: OwnerUsage | null): usage is OwnerUsage {
  return usage !== null
}
