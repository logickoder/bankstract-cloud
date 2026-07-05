// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from './auth'

// Server-side session. The user id is the `owner` we scope all worker key calls by.
export async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user.id ?? null
}

export async function getUser(): Promise<{ id: string; email: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return null
  return { id: session.user.id, email: session.user.email }
}

// Route-layer guards. Return the value on success, a 401 NextResponse on missing session.
// Usage: `const owner = await requireOwner(); if (owner instanceof NextResponse) return owner`
export async function requireOwner(): Promise<string | NextResponse> {
  const owner = await getUserId()
  if (!owner) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  return owner
}

export async function requireUser(): Promise<{ id: string; email: string } | NextResponse> {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  return user
}
