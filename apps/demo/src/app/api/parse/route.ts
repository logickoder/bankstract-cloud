// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { NextRequest } from 'next/server'

// Streaming a request body requires the Node runtime (Edge rejects duplex fetch).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Hop-by-hop + identity headers we must not forward upstream. content-length is
// dropped so the streamed (chunked) body isn't described by a stale length.
const STRIP_HEADERS = new Set([
  'content-length',
  'connection',
  'transfer-encoding',
  'keep-alive',
  'host',
  'cookie',
  'accept-encoding',
])

function jsonError(message: string, status: number): Response {
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

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.DEMO_API_KEY
  // WORKER_URL is server-only + runtime-settable (preferred for self-host). Falls back
  // to NEXT_PUBLIC_API_URL for local dev. The browser never uses either — it posts here.
  const base = process.env.WORKER_URL ?? process.env.NEXT_PUBLIC_API_URL
  if (!apiKey || !base) {
    // Fail fast + loud: an empty key would otherwise surface as a misleading 401.
    console.error('demo proxy misconfigured: DEMO_API_KEY or NEXT_PUBLIC_API_URL is unset')
    return jsonError('demo misconfigured', 500)
  }

  const format = request.nextUrl.searchParams.get('format')
  const workerUrl = new URL('/v1/parse', base)
  if (format === 'csv' || format === 'json') {
    workerUrl.searchParams.set('format', format)
  }

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

  // Stream the multipart body straight through. Do NOT call request.formData() —
  // it drains the single-consumption body and would lose the 50MB stream and the
  // multipart boundary (carried verbatim in the copied content-type header).
  const init: RequestInit & { duplex: 'half' } = {
    method: 'POST',
    body: request.body,
    headers,
    signal: request.signal,
    duplex: 'half',
  }

  let upstream: Response
  try {
    upstream = await fetch(workerUrl, init)
  } catch {
    return jsonError('worker unreachable', 502)
  }

  const responseHeaders = new Headers()
  for (const pass of ['content-type', 'content-disposition']) {
    const value = upstream.headers.get(pass)
    if (value) responseHeaders.set(pass, value)
  }
  for (const [key, value] of upstream.headers) {
    if (key.toLowerCase().startsWith('x-bankstract-')) responseHeaders.set(key, value)
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
}
