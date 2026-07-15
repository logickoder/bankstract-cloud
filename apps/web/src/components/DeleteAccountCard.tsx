// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
} from '@bankstract/ui'
import { useId, useState } from 'react'

import { authClient } from '@/lib/auth-client'

// Self-serve account erasure. Type-to-confirm the email, then DELETE /api/account (which cancels
// any live subscription, purges worker data, and deletes the auth records), then sign out.
export function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const confirmId = useId()
  const errorId = useId()
  const matches = confirm.trim() === email

  async function remove() {
    if (!matches) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (!res.ok) {
      setBusy(false)
      setError('Could not delete the account. Try again, or email jeffery@logickoder.dev.')
      return
    }
    // Data is gone; end the session and leave the dashboard. The session row was just
    // cascade-deleted, so signOut may reject; leave regardless.
    try {
      await authClient.signOut()
    } catch {
      // ignore
    }
    window.location.href = '/'
  }

  return (
    <Card className="mt-4 border-error/40">
      <h2 className="font-display text-lg font-semibold text-fg">Delete account</h2>
      <p className="mt-2 text-sm text-fg-secondary">
        Removes your account, your keys, and your sessions. Cancels any active subscription. This
        cannot be undone.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        onClick={() => {
          setConfirm('')
          setError('')
          setOpen(true)
        }}
      >
        Delete account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            Everything tied to this account is erased and any subscription is cancelled. Type your
            email to confirm.
          </DialogDescription>
          <div className="mt-4 flex flex-col gap-3">
            <label htmlFor={confirmId} className="text-sm text-fg-secondary">
              Email
            </label>
            <Input
              id={confirmId}
              type="email"
              autoComplete="off"
              placeholder={email}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            {error ? (
              <p id={errorId} role="alert" className="text-sm text-error">
                {error}
              </p>
            ) : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!matches || busy}
                onClick={() => void remove()}
              >
                {busy ? 'Deleting...' : 'Delete account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
