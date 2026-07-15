// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Button, Input, linkClass } from '@bankstract/ui'
import { useId, useState } from 'react'
import { z } from 'zod'

import { GithubIcon, GoogleIcon } from '@/components/icons'
import { authClient } from '@/lib/auth-client'

// Sign-in === sign-up: OAuth + magic-link auto-provision the account on first use.
// No password, no MFA (deferred). Voice: direct, period-split, no greetings.
const emailSchema = z.string().email()

type Status = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string }

export function SignInForm({ title = 'Sign in' }: { title?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [oauthPending, setOauthPending] = useState<null | 'google' | 'github'>(null)
  const emailId = useId()
  const errorId = useId()
  const isError = status.kind === 'error'
  const busy = status.kind === 'sending' || oauthPending !== null

  async function social(provider: 'google' | 'github') {
    setOauthPending(provider)
    try {
      // On success the browser redirects to the provider, so no reset on the happy path.
      await authClient.signIn.social({ provider, callbackURL: '/dashboard' })
    } catch {
      setOauthPending(null)
      setStatus({ kind: 'error', message: 'OAuth handshake failed. Retry or try email.' })
    }
  }

  async function magicLink() {
    if (!emailSchema.safeParse(email).success) {
      setStatus({ kind: 'error', message: 'Email format off.' })
      return
    }
    setStatus({ kind: 'sending' })
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: '/dashboard' })
    setStatus(
      error ? { kind: 'error', message: 'Could not send the link. Try again.' } : { kind: 'sent' },
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight text-fg">{title}</h1>
      <p className="mt-2 text-fg-secondary">Email magic-link or social. Pick one.</p>

      <div className="mt-8 flex flex-col gap-3">
        <Button
          variant="secondary"
          className="w-full gap-2"
          disabled={busy}
          onClick={() => void social('google')}
        >
          <GoogleIcon /> {oauthPending === 'google' ? 'Redirecting...' : 'Continue with Google'}
        </Button>
        <Button
          variant="secondary"
          className="w-full gap-2"
          disabled={busy}
          onClick={() => void social('github')}
        >
          <GithubIcon className="size-4" />{' '}
          {oauthPending === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
        </Button>

        <div className="flex items-center gap-3 py-1 text-xs text-fg-tertiary">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        {status.kind === 'sent' ? (
          <div className="flex flex-col gap-2">
            <p
              role="status"
              className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
            >
              Check your inbox. The link expires in 15 minutes.
            </p>
            <button
              type="button"
              className={`self-start text-sm ${linkClass}`}
              onClick={() => setStatus({ kind: 'idle' })}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void magicLink()
            }}
          >
            <label htmlFor={emailId} className="sr-only">
              Email address
            </label>
            <Input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={isError}
              aria-describedby={isError ? errorId : undefined}
            />
            <Button type="submit" variant="primary" className="w-full" disabled={busy}>
              {status.kind === 'sending' ? 'Sending...' : 'Email me a magic link'}
            </Button>
            {status.kind === 'error' ? (
              <p id={errorId} role="alert" className="text-sm text-error">
                {status.message}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  )
}
