// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { getUserId } from './session'
import {
  type KeyInfo,
  type OwnerUsage,
  type SubscriptionStatusResponse,
  workerFetch,
} from './worker'

// `null` means "no data" (no signed-in owner, or the worker call failed). The dashboard degrades
// gracefully to empty state rather than 500ing the whole page when the worker is transiently
// unreachable. error.tsx still catches genuine render crashes; loading.tsx streams a skeleton.
async function ownerFetch<T>(path: (owner: string) => string): Promise<T | null> {
  const owner = await getUserId()
  if (!owner) return null
  try {
    const res = await workerFetch(path(owner))
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
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
