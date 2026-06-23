// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createClient } from '@libsql/client'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { beforeAll, describe, expect, it } from 'vitest'

import * as schema from './schema'

// Smoke test for the better-auth x drizzle-orm pairing. The overage-audit security pass bumped
// drizzle-orm 0.39 -> 0.45 (GHSA-gpj5-g38j-94v9, SQL identifier escaping). 0.45.2 is exactly
// better-auth's declared peer, but the route/component tests mock the session, so nothing here
// actually drove the adapter's generated SQL. This boots a real better-auth over the SAME drizzle
// adapter the app uses (in-memory libSQL, no Next/Resend coupling) and runs sign-up + sign-in, so
// create + the findOne WHERE path (the escaping the advisory touched) execute against 0.45.

// Mirrors src/lib/db/schema.ts. better-auth supplies every column on insert; defaults are a
// safety net so an insert that omits a timestamp still satisfies NOT NULL.
const _TS = "(cast(unixepoch('subsecond') * 1000 as integer))"
const DDL = [
  `CREATE TABLE user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL DEFAULT ${_TS},
    updated_at INTEGER NOT NULL DEFAULT ${_TS},
    paystack_customer_id TEXT,
    subscription_tier TEXT,
    subscription_status TEXT,
    api_keys_issued_at TEXT
  )`,
  `CREATE TABLE session (
    id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL DEFAULT ${_TS},
    updated_at INTEGER NOT NULL DEFAULT ${_TS},
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL DEFAULT ${_TS},
    updated_at INTEGER NOT NULL DEFAULT ${_TS}
  )`,
  `CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT ${_TS},
    updated_at INTEGER NOT NULL DEFAULT ${_TS}
  )`,
]

const EMAIL = 'dev@acme.test'
const PASSWORD = 'correct-horse-battery-staple'

// A factory so `auth`'s type is the concrete instance (ReturnType<typeof betterAuth> collapses
// to the generic Auth<BetterAuthOptions>, which the specific config is not assignable to).
function buildAuth(database: LibSQLDatabase<typeof schema>) {
  return betterAuth({
    baseURL: 'http://localhost:3000',
    secret: 'smoke-test-secret-not-a-real-key',
    database: drizzleAdapter(database, { provider: 'sqlite' }),
    // Password is enabled only here to drive create + findOne without the magic-link round-trip;
    // the app itself keeps emailAndPassword disabled. This test targets the DB adapter, not policy.
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        paystackCustomerId: { type: 'string', required: false },
        subscriptionTier: { type: 'string', required: false },
        subscriptionStatus: { type: 'string', required: false },
        apiKeysIssuedAt: { type: 'string', required: false },
      },
    },
  })
}

let db: LibSQLDatabase<typeof schema>
let auth: ReturnType<typeof buildAuth>

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  for (const stmt of DDL) await client.execute(stmt)
  db = drizzle(client, { schema })
  auth = buildAuth(db)
})

describe('better-auth x drizzle-orm adapter (in-memory libSQL)', () => {
  it('creates a user row through the adapter on sign-up', async () => {
    await auth.api.signUpEmail({ body: { email: EMAIL, password: PASSWORD, name: 'ACME Dev' } })

    const rows = await db.select().from(schema.user).where(eq(schema.user.email, EMAIL))
    expect(rows).toHaveLength(1)
    expect(rows[0]!.email).toBe(EMAIL)
  })

  it('signs in (adapter findOne + session create) and persists a session', async () => {
    const res = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } })
    expect(res.token).toBeTruthy()

    const sessions = await db.select().from(schema.session)
    expect(sessions.length).toBeGreaterThan(0)
    expect(sessions[0]!.userId).toBeTruthy()
  })

  it('rejects a wrong password (findOne resolves, credential check fails)', async () => {
    await expect(
      auth.api.signInEmail({ body: { email: EMAIL, password: 'wrong-password' } }),
    ).rejects.toThrow()
  })
})
