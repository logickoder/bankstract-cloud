// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/lib/auth'

export const { GET, POST } = toNextJsHandler(auth)
