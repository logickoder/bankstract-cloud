// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { NextRequest } from 'next/server'

import { jsonError, tryFetch, uploadInit, workerConfig } from './_shared'

// Proxies the multipart upload to the worker's /v1/parse, attaching the server-only demo key.
// The thin route file declares `runtime = 'nodejs'` + `dynamic = 'force-dynamic'`.
export async function parse(request: NextRequest): Promise<Response> {
  const config = workerConfig()
  if (config === null) return jsonError('demo misconfigured', 500)

  const format = request.nextUrl.searchParams.get('format')
  const workerUrl = new URL('/v1/parse', config.base)
  if (format === 'csv' || format === 'json') {
    workerUrl.searchParams.set('format', format)
  }

  const upstream = await tryFetch(workerUrl, uploadInit(request, config.apiKey))
  if (upstream === null) return jsonError('worker unreachable', 502)

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
