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
import { useEffect, useState } from 'react'

import { EnvBadge, StatusBadge } from '@/components/KeyBadges'
import { PageHeading } from '@/components/PageHeading'
import type { KeyCreatedResponse, KeyInfo } from '@/lib/worker'

function fmtDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export function KeysClient({ initialKeys }: { initialKeys: KeyInfo[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [env, setEnv] = useState<'test' | 'live'>('test')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<KeyCreatedResponse | null>(null)
  const { copied, copy } = useClipboard()

  // Overview's "Create your first key" CTA links here with ?create=1 to open the dialog directly.
  useEffect(() => {
    if (searchParams.get('create') === '1') setOpen(true)
  }, [searchParams])

  function reset() {
    setName('')
    setEnv('test')
    setError('')
    setCreated(null)
  }

  async function create() {
    if (!name.trim()) {
      setError('Name the key.')
      return
    }
    setBusy(true)
    setError('')
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), env }),
    })
    setBusy(false)
    if (!res.ok) {
      setError('Could not create the key. Try again.')
      return
    }
    setCreated((await res.json()) as KeyCreatedResponse)
    router.refresh()
  }

  async function revoke(id: string) {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' })
    if (res.ok) router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <PageHeading title="API keys" subtitle="Issue a key, then call /v1/parse with it." />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            reset()
            setOpen(true)
          }}
        >
          Create key
        </Button>
      </div>

      {initialKeys.length === 0 ? (
        <Card className="mt-8 py-8 text-center text-fg-tertiary">
          No keys yet. Create one to get started.
        </Card>
      ) : (
        <>
          <Card className="mt-8 hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-tertiary/40 text-fg-tertiary">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal">Prefix</th>
                  <th className="px-4 py-3 font-normal">Env</th>
                  <th className="px-4 py-3 font-normal">Created</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="text-fg">
                {initialKeys.map((k) => (
                  <tr
                    key={k.id}
                    className="border-b border-border/60 transition-colors hover:bg-bg-secondary/40"
                  >
                    <td className="px-4 py-3">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-secondary">{k.prefix}</td>
                    <td className="px-4 py-3">
                      <EnvBadge env={k.env} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-fg-secondary">
                      {fmtDate(k.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge revoked={Boolean(k.revoked_at)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.revoked_at ? null : (
                        <Button variant="ghost" size="sm" onClick={() => void revoke(k.id)}>
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="mt-8 flex flex-col gap-3 md:hidden">
            {initialKeys.map((k) => (
              <Card key={k.id} className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-fg">{k.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-fg-secondary">{k.prefix}</div>
                  </div>
                  {k.revoked_at ? null : (
                    <Button variant="ghost" size="sm" onClick={() => void revoke(k.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-tertiary">
                  <EnvBadge env={k.env} />
                  <StatusBadge revoked={Boolean(k.revoked_at)} />
                  <span className="font-mono">Created {fmtDate(k.created_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {created ? (
            <>
              <DialogTitle>Copy your key now</DialogTitle>
              <DialogDescription>
                This is the only time we show it. Store it somewhere safe.
              </DialogDescription>
              <div className="mt-4 rounded-md border border-border bg-bg-tertiary p-3 font-mono text-xs break-all text-fg">
                {created.key}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => void copy(created.key)}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button size="sm" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle>Create an API key</DialogTitle>
              <DialogDescription>Name it, pick an environment.</DialogDescription>
              <div className="mt-4 flex flex-col gap-3">
                <Input
                  placeholder="e.g. production server"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div className="flex gap-2">
                  {(['test', 'live'] as const).map((e) => (
                    <Button
                      key={e}
                      variant={env === e ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setEnv(e)}
                    >
                      {e}
                    </Button>
                  ))}
                </div>
                {error ? <p className="text-sm text-error">{error}</p> : null}
                <div className="mt-2 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={busy} onClick={() => void create()}>
                    {busy ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
