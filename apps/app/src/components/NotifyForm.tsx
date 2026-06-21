// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Button, Input } from '@bankstract/ui'
import { useState } from 'react'

export function NotifyForm({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function submit() {
    if (!email.trim()) return
    setState('busy')
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    setState(res.ok ? 'done' : 'error')
  }

  if (state === 'done') {
    return <p className="mt-4 text-sm text-fg">You are on the list. We will email you once.</p>
  }

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:flex-1"
      />
      <Button size="sm" disabled={state === 'busy'} onClick={() => void submit()}>
        {state === 'busy' ? 'Adding...' : 'Notify me'}
      </Button>
      {state === 'error' ? (
        <p className="text-sm text-error sm:hidden">Could not save. Try again.</p>
      ) : null}
    </div>
  )
}
