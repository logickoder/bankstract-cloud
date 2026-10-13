// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { KeysClient } from '@/components/KeysClient'
import { PageHeading } from '@/components/PageHeading'
import { Unavailable } from '@/components/Unavailable'
import { fetchKeys } from '@/lib/dashboard-data'

export default async function KeysPage() {
  const keys = await fetchKeys()
  if (keys === null) {
    return (
      <div>
        <PageHeading title="API keys" subtitle="Call /v1/parse with a key in the Authorization header." />
        <Unavailable what="Your keys are" />
      </div>
    )
  }
  return <KeysClient initialKeys={keys} />
}
