// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { forwardRef, useImperativeHandle, useRef } from 'react'

export interface TurnstileHandle {
  // Resolves to a fresh token, executing the (invisible) challenge if needed.
  getToken: () => Promise<string>
  reset: () => void
}

// Wraps the Cloudflare Turnstile widget in invisible/managed mode and exposes an
// imperative token getter. Tokens are single-use server-side, so callers reset()
// after each parse. With the always-pass test site key the widget may render a
// visible checkbox in dev. That is cosmetic; prod uses a real invisible key.
const TOKEN_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_TURNSTILE_TIMEOUT_MS ?? '8000')

export const TurnstileGate = forwardRef<TurnstileHandle>(function TurnstileGate(_props, ref) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
  const inner = useRef<TurnstileInstance>(null)

  useImperativeHandle(ref, () => ({
    // Never hang the UI on Turnstile: if it doesn't resolve, fall back to an empty
    // token (the worker rejects it with 401, which the demo surfaces cleanly).
    getToken: async () => {
      const pending = inner.current?.getResponsePromise()
      if (!pending) return ''
      const timeout = new Promise<string>((resolve) => {
        setTimeout(() => resolve(''), TOKEN_TIMEOUT_MS)
      })
      try {
        return await Promise.race([pending, timeout])
      } catch {
        return ''
      }
    },
    reset: () => inner.current?.reset(),
  }))

  return <Turnstile ref={inner} siteKey={siteKey} options={{ size: 'invisible' }} />
})
