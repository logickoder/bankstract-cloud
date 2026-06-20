// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { NextRequest } from 'next/server'

import { SUPPORTED_BANKS } from '../../../lib/banks'

export const runtime = 'nodejs'

// Sample statements are the engine's own committed REDACTED fixtures, fetched at
// runtime, never vendored into this repo (no bank PDFs here, ever). The client
// then runs them through the normal parse flow.
const FIXTURE_BASE = 'https://raw.githubusercontent.com/logickoder/bankstract/main/tests'
const BANKS = new Set<string>(SUPPORTED_BANKS)

export async function GET(request: NextRequest): Promise<Response> {
  const bank = request.nextUrl.searchParams.get('bank') ?? ''
  if (!BANKS.has(bank)) {
    return new Response('unknown sample', { status: 404 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${FIXTURE_BASE}/${bank}/fixtures/sample.pdf`)
  } catch {
    return new Response('sample unavailable', { status: 502 })
  }
  if (!upstream.ok) {
    return new Response('sample unavailable', { status: 502 })
  }

  return new Response(upstream.body, {
    status: 200,
    headers: { 'content-type': 'application/pdf' },
  })
}
