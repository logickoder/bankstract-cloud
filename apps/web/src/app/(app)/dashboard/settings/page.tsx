// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Card } from '@bankstract/ui'

import { DeleteAccountCard } from '@/components/DeleteAccountCard'
import { PageHeading } from '@/components/PageHeading'
import { getUser } from '@/lib/session'

export default async function SettingsPage() {
  const user = await getUser()
  return (
    <div className="max-w-2xl">
      <PageHeading title="Settings" subtitle="Your account, and how to delete it." />

      {user ? (
        <>
          <Card className="mt-8">
            <div className="text-sm text-fg-secondary">Signed in as</div>
            <div className="mt-1 font-mono text-sm text-fg">{user.email}</div>
          </Card>
          <DeleteAccountCard email={user.email} />
        </>
      ) : null}
    </div>
  )
}
