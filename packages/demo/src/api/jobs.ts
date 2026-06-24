// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { NextRequest } from 'next/server'

import { jsonError, tryFetch, uploadInit, workerConfig } from './_shared'

type RouteContext = { params: Promise<{ id: string }> }

function passthrough(upstream: Response): Response {
  // Surface the worker's error envelope (401/402/413/429) verbatim.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}

// Submit a long parse as an async job. Mirrors the parse proxy (server-only demo key + client IP),
// then rewrites the worker's /v1 urls to same-origin /api so the browser's EventSource stays
// same-origin in dev and prod alike. The thin route declares runtime = 'nodejs' + force-dynamic.
export async function submitJob(request: NextRequest): Promise<Response> {
  const config = workerConfig()
  if (config === null) return jsonError('demo misconfigured', 500)

  const upstream = await tryFetch(
    new URL('/v1/parse/jobs', config.base),
    uploadInit(request, config.apiKey),
  )
  if (upstream === null) return jsonError('worker unreachable', 502)
  if (!upstream.ok) return passthrough(upstream)

  const body = (await upstream.json()) as { job_id?: string }
  const jobId = body.job_id
  if (!jobId) return jsonError('worker returned no job id', 502)
  return Response.json({
    job_id: jobId,
    stream_url: `/api/parse/jobs/${jobId}/stream`,
    poll_url: `/api/parse/jobs/${jobId}`,
  })
}

// Pipe the worker's SSE progress stream straight through, unbuffered. The stream is authorized by
// the unguessable job_id alone (capability), so no key is attached here.
export async function streamJob(request: NextRequest, ctx: RouteContext): Promise<Response> {
  const config = workerConfig()
  if (config === null) return jsonError('demo misconfigured', 500)

  const { id } = await ctx.params
  const workerUrl = new URL(`/v1/parse/jobs/${encodeURIComponent(id)}/stream`, config.base)
  const upstream = await tryFetch(workerUrl, { signal: request.signal })
  if (upstream === null) return jsonError('worker unreachable', 502)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'x-accel-buffering': 'no',
      connection: 'keep-alive',
    },
  })
}

// Poll a job's JSON snapshot (the SSE fallback). The worker's poll endpoint is authenticated, so the
// demo key is attached; ownership matches because the job was submitted with that same key.
export async function pollJob(request: NextRequest, ctx: RouteContext): Promise<Response> {
  const config = workerConfig()
  if (config === null) return jsonError('demo misconfigured', 500)

  const { id } = await ctx.params
  const workerUrl = new URL(`/v1/parse/jobs/${encodeURIComponent(id)}`, config.base)
  const upstream = await tryFetch(workerUrl, {
    headers: { authorization: `Bearer ${config.apiKey}` },
    signal: request.signal,
  })
  if (upstream === null) return jsonError('worker unreachable', 502)
  return passthrough(upstream)
}
