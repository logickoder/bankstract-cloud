// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Streaming a request body requires the Node runtime (Edge rejects duplex fetch).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export { parse as POST } from '@bankstract/demo/api'
