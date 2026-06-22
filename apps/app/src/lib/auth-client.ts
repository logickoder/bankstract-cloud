// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // Absolute auth base, baked at build. Under a prod basePath this is <origin>/app, so the client
  // hits <origin>/app/api/auth. Empty in dev/e2e -> undefined -> better-auth uses the page origin.
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
  plugins: [magicLinkClient()],
})

export const { signIn, signOut, useSession } = authClient
