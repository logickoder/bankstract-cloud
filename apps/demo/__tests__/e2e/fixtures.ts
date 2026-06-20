// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { ParseResponse } from '@bankstract/types'

// Synthetic, never real bank data. Placeholders only (FOO/ACME/1111), string money.
export const SYNTHETIC_PDF = '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'

export const FIXTURE_RESPONSE: ParseResponse = {
  format_version: 'fbn-2026-01',
  metadata: {
    bank: 'fbn',
    account_holder: 'ACME',
    account_number_masked: '****1111',
    statement_period_start: '2026-01-01T00:00:00',
    statement_period_end: '2026-01-31T00:00:00',
    opening_balance: '100.00',
    closing_balance: '250.50',
  },
  totals: { credit: '500.00', debit: '120.00' },
  row_wise_reconcilable: true,
  transactions: [
    {
      date: '2026-01-05T09:30:00',
      narration: 'FOO TRANSFER',
      debit: '0',
      credit: '500.00',
      balance: '600.00',
      reference: 'REF1',
      currency: 'NGN',
    },
    {
      date: '2026-01-06T12:00:00',
      narration: 'ACME POS',
      debit: '120.00',
      credit: '0',
      balance: '480.00',
      reference: 'REF2',
      currency: 'NGN',
    },
  ],
}
