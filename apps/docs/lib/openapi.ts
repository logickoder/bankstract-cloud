// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createOpenAPI } from 'fumadocs-openapi/server'

// The spec is exported from the worker (apps/worker/scripts/export_openapi.py) and
// committed as openapi.json, so the docs build never needs a running worker.
export const openapi = createOpenAPI({
  input: ['./openapi.json'],
})
