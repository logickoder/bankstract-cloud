// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Button } from '@bankstract/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { authClient } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    try {
      await authClient.signOut()
      router.push('/sign-in')
    } catch {
      setPending(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => void signOut()}>
      {pending ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
