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
  useClipboard,
} from '@bankstract/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

import { StatusBadge } from '@/components/KeyBadges'
import { PageHeading } from '@/components/PageHeading'
import type { KeyCreatedResponse, KeyInfo } from '@/lib/worker'

function fmtDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export function KeysClient({ initialKeys }: { initialKeys: KeyInfo[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Exactly one active test key per owner; live keys are a free-form list.
  const testKey = initialKeys.find((k) => k.tier === 'test' && !k.revoked_at) ?? null
  const liveKeys = initialKeys.filter((k) => k.tier === 'live')

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const [createError, setCreateError] = useState('')

  const [created, setCreated] = useState<KeyCreatedResponse | null>(null)

  const [testBusy, setTestBusy] = useState(false)
  const [testError, setTestError] = useState('')
  const [confirmRoll, setConfirmRoll] = useState(false)

  const [confirmRevoke, setConfirmRevoke] = useState<KeyInfo | null>(null)
  const [revokeBusy, setRevokeBusy] = useState(false)
  const [revokeError, setRevokeError] = useState('')

  const { copied, copy } = useClipboard()
  const nameId = useId()
  const nameErrorId = useId()

  // Overview's "Create your first key" CTA links here with ?create=1 to open the live-key dialog.
  useEffect(() => {
    if (searchParams.get('create') === '1') setCreateOpen(true)
  }, [searchParams])

  async function createLiveKey() {
    if (!name.trim()) {
      setCreateError('Name the key.')
      return
    }
    setCreateBusy(true)
    setCreateError('')
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setCreateBusy(false)
    if (!res.ok) {
      setCreateError('Could not create the key. Try again.')
      return
    }
    setCreateOpen(false)
    setName('')
    setCreated((await res.json()) as KeyCreatedResponse)
    router.refresh()
  }

  async function rollTestKey() {
    setConfirmRoll(false)
    setTestBusy(true)
    setTestError('')
    const res = await fetch('/api/keys/test', { method: 'POST' })
    setTestBusy(false)
    if (!res.ok) {
      setTestError('Could not issue the test key. Try again.')
      return
    }
    setCreated((await res.json()) as KeyCreatedResponse)
    router.refresh()
  }

  async function doRevoke() {
    if (!confirmRevoke) return
    setRevokeBusy(true)
    setRevokeError('')
    const res = await fetch(`/api/keys/${confirmRevoke.id}`, { method: 'DELETE' })
    setRevokeBusy(false)
    if (res.ok) {
      setConfirmRevoke(null)
      router.refresh()
    } else {
      setRevokeError('Could not revoke the key. Try again.')
    }
  }

  return (
    <div>
      <PageHeading title="API keys" subtitle="Call /v1/parse with a key in the Authorization header." />

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-fg">Test key</h2>
        <p className="mt-1 text-sm text-fg-secondary">
          One key for integration. Free up to 25 parses a month, then it returns sample data.
        </p>
        <Card className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {testKey ? (
            <div className="min-w-0">
              <div className="font-mono text-sm text-fg">{testKey.prefix}</div>
              <div className="mt-1 font-mono text-xs text-fg-tertiary">
                Created {fmtDate(testKey.created_at)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-fg-tertiary">No test key yet.</div>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={testBusy}
            onClick={() => (testKey ? setConfirmRoll(true) : void rollTestKey())}
          >
            {testBusy ? 'Working...' : testKey ? 'Regenerate' : 'Generate test key'}
          </Button>
        </Card>
        {testError ? (
          <p role="alert" className="mt-2 text-sm text-error">
            {testError}
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-fg">Live keys</h2>
            <p className="mt-1 text-sm text-fg-secondary">
              Production keys. Parse under an active subscription. Make as many as you need.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="shrink-0 self-start whitespace-nowrap sm:self-auto"
            onClick={() => setCreateOpen(true)}
          >
            Create key
          </Button>
        </div>

        {liveKeys.length === 0 ? (
          <Card className="mt-3 py-8 text-center text-fg-tertiary">No live keys yet.</Card>
        ) : (
          <>
            <Card className="mt-3 hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-bg-tertiary/40 text-fg-tertiary">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 font-normal">Name</th>
                    <th className="px-4 py-3 font-normal">Prefix</th>
                    <th className="px-4 py-3 font-normal">Created</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="text-fg">
                  {liveKeys.map((k) => (
                    <tr
                      key={k.id}
                      className="border-b border-border/60 transition-colors hover:bg-bg-secondary/40"
                    >
                      <td className="px-4 py-3">{k.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-secondary">{k.prefix}</td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-secondary">
                        {fmtDate(k.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge revoked={Boolean(k.revoked_at)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {k.revoked_at ? null : (
                          <Button variant="ghost" size="sm" onClick={() => setConfirmRevoke(k)}>
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <div className="mt-3 flex flex-col gap-3 md:hidden">
              {liveKeys.map((k) => (
                <Card key={k.id} className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm text-fg">{k.name}</div>
                      <div className="mt-0.5 font-mono text-xs text-fg-secondary">{k.prefix}</div>
                    </div>
                    {k.revoked_at ? null : (
                      <Button variant="ghost" size="sm" onClick={() => setConfirmRevoke(k)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-tertiary">
                    <StatusBadge revoked={Boolean(k.revoked_at)} />
                    <span className="font-mono">Created {fmtDate(k.created_at)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) {
            setName('')
            setCreateError('')
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Create a live key</DialogTitle>
          <DialogDescription>Name it so you can tell your keys apart later.</DialogDescription>
          <div className="mt-4 flex flex-col gap-3">
            <label htmlFor={nameId} className="text-sm text-fg-secondary">
              Key name
            </label>
            <Input
              id={nameId}
              placeholder="e.g. production server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(createError)}
              aria-describedby={createError ? nameErrorId : undefined}
            />
            {createError ? (
              <p id={nameErrorId} role="alert" className="text-sm text-error">
                {createError}
              </p>
            ) : null}
            <div className="mt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" disabled={createBusy} onClick={() => void createLiveKey()}>
                {createBusy ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={created !== null} onOpenChange={(o) => !o && setCreated(null)}>
        <DialogContent>
          <DialogTitle>Copy your key now</DialogTitle>
          <DialogDescription>
            This is the only time we show it. Store it somewhere safe.
          </DialogDescription>
          <div className="mt-4 rounded-md border border-border bg-bg-tertiary p-3 font-mono text-xs break-all text-fg">
            {created?.key}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => created && void copy(created.key)}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button size="sm" onClick={() => setCreated(null)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRoll} onOpenChange={setConfirmRoll}>
        <DialogContent>
          <DialogTitle>Regenerate the test key?</DialogTitle>
          <DialogDescription>
            The current test key stops working immediately. Update anything using it.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmRoll(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={testBusy} onClick={() => void rollTestKey()}>
              {testBusy ? 'Working...' : 'Regenerate'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmRevoke !== null}
        onOpenChange={(o) => {
          if (!o) {
            setConfirmRevoke(null)
            setRevokeError('')
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Revoke this key?</DialogTitle>
          <DialogDescription>
            {confirmRevoke ? (
              <>
                <span className="font-mono text-fg-secondary">{confirmRevoke.prefix}</span> stops
                working immediately. This cannot be undone.
              </>
            ) : null}
          </DialogDescription>
          {revokeError ? (
            <p role="alert" className="mt-3 text-sm text-error">
              {revokeError}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmRevoke(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={revokeBusy} onClick={() => void doRevoke()}>
              {revokeBusy ? 'Revoking...' : 'Revoke key'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
