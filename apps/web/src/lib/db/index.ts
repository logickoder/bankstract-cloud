// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

// Auth records (users + sessions) live in our own SQLite file (libSQL), keeping the
// self-host bundle fully self-contained. Swap the url to a Turso/libsql server URL for
// a multi-instance deploy without code changes.
const dbPath = process.env.AUTH_DB_PATH ?? './data/auth.db'

// libSQL/SQLite opens the file but does NOT create its parent directory, and `./data` is absent
// on a fresh checkout (CI build "collect page data", first boot). Create it so the open succeeds.
mkdirSync(dirname(dbPath), { recursive: true })

export const db = drizzle(createClient({ url: `file:${dbPath}` }), { schema })
