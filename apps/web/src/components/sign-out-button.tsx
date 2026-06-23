// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Button } from '@bankstract/ui'
import { useRouter } from 'next/navigation'

import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void authClient.signOut().then(() => router.push('/sign-in'))}
    >
      Sign out
    </Button>
  )
}
