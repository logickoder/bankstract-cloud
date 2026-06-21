// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { next } from '@bankstract/eslint-config/next'

export default [...next, { ignores: ['.next/**', 'next-env.d.ts', 'data/**'] }]
