// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// SSE proxy: pipe the worker's progress stream to the browser. Node runtime for the streamed body.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export { streamJob as GET } from '@bankstract/demo/api'
