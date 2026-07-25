// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ogRoute } from '@bankstract/seo'

// The standalone marketing shell serves the home at its root; its card lives at /og.
export const { GET } = ogRoute({
  line1: 'Statement parsing API',
  line2: 'for Nigerian banks',
  subtitle: 'One API call. Clean transactions, account metadata, NDPR-compliant redaction.',
})
