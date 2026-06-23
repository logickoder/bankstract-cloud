// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { KeysClient } from '@/components/KeysClient'
import { fetchKeys } from '@/lib/dashboard-data'

export default async function KeysPage() {
  const keys = await fetchKeys()
  return <KeysClient initialKeys={keys} />
}
