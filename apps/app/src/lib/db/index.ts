// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

import * as schema from './schema'

// Auth records (users + sessions) live in our own SQLite file (libSQL), keeping the
// self-host bundle fully self-contained. Swap the url to a Turso/libsql server URL for
// a multi-instance deploy without code changes.
const url = `file:${process.env.AUTH_DB_PATH ?? './data/auth.db'}`

export const db = drizzle(createClient({ url }), { schema })
