// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { NextRequest } from 'next/server'

// Hop-by-hop + identity headers we must not forward upstream. content-length is dropped so a
// streamed (chunked) body isn't described by a stale length.
const STRIP_HEADERS = new Set([
  'content-length',
  'connection',
  'transfer-encoding',
  'keep-alive',
  'host',
  'cookie',
  'accept-encoding',
])

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function pickClientIp(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]
    if (first) return first.trim()
  }
  return ''
}

// WORKER_URL is server-only + runtime-settable (preferred for self-host); falls back to
// NEXT_PUBLIC_API_URL for local dev. The browser never sees either or the key - it posts to the
// same-origin proxy, which attaches DEMO_API_KEY here. Returns null (and logs) when misconfigured.
export function workerConfig(): { base: string; apiKey: string } | null {
  const apiKey = process.env.DEMO_API_KEY
  const base = process.env.WORKER_URL ?? process.env.NEXT_PUBLIC_API_URL
  if (!apiKey || !base) {
    console.error('demo proxy misconfigured: DEMO_API_KEY or WORKER_URL is unset')
    return null
  }
  return { base, apiKey }
}

// Copy the client headers (minus hop-by-hop), attach the demo bearer, and pin the real client IP so
// the worker's per-IP rate limit sees the visitor, not the proxy.
export function proxyHeaders(request: NextRequest, apiKey: string): Headers {
  const headers = new Headers()
  for (const [key, value] of request.headers) {
    if (!STRIP_HEADERS.has(key.toLowerCase())) headers.set(key, value)
  }
  headers.set('authorization', `Bearer ${apiKey}`)
  const clientIp = pickClientIp(request)
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp)
    headers.set('cf-connecting-ip', clientIp)
  }
  return headers
}

// Stream the multipart upload straight through (duplex). Do NOT call request.formData(): it drains
// the single-consumption body and loses the 50MB stream + the multipart boundary.
export function uploadInit(request: NextRequest, apiKey: string): RequestInit & { duplex: 'half' } {
  return {
    method: 'POST',
    body: request.body,
    headers: proxyHeaders(request, apiKey),
    signal: request.signal,
    duplex: 'half',
  }
}

// fetch that never throws: returns null on a network error so callers map one 502.
export async function tryFetch(url: URL, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init)
  } catch {
    return null
  }
}
