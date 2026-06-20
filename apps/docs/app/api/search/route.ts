// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createFromSource } from 'fumadocs-core/search/server'

import { source } from '@/lib/source'

export const { GET } = createFromSource(source, {
  language: 'english',
})
