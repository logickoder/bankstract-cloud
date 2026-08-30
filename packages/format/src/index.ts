// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { DecimalString } from '@bankstract/types'

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

// Money crosses the wire as a decimal STRING. We group thousands by manipulating the
// string only, never Number()/parseFloat/toFixed, which would corrupt naira precision
// (DESIGN money law + NDPR).
function groupThousands(intPart: string): string {
  const negative = intPart.startsWith('-')
  const digits = negative ? intPart.slice(1) : intPart
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return negative ? `-${grouped}` : grouped
}

export function displayMoney(value: DecimalString | null): string {
  if (value === null || value === '') return '-'
  const dot = value.indexOf('.')
  if (dot === -1) return groupThousands(value)
  return `${groupThousands(value.slice(0, dot))}${value.slice(dot)}`
}

// Naija banks report NGN. Prefix the sign for the summary line. Symbol only, still
// the verbatim grouped string (no numeric coercion).
export function displayNaira(value: DecimalString | null): string {
  const shown = displayMoney(value)
  return shown === '-' ? shown : `₦${shown}`
}

// Mobile cards show a single signed amount instead of separate debit/credit columns.
export function signedNaira(
  debit: DecimalString,
  credit: DecimalString | null,
): { text: string; isCredit: boolean } {
  const isCredit = credit !== null && credit !== '' && credit !== '0'
  const value = isCredit ? credit : debit
  return { text: `${isCredit ? '+' : '−'} ${displayNaira(value)}`, isCredit }
}

export function displayBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// "2026-01-05T09:30:00" -> "05 Jan 2026". Parses the date part directly to avoid
// timezone drift from new Date(iso).
export function displayDate(iso: string | null): string {
  if (!iso) return '-'
  const datePart = iso.slice(0, 10)
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return iso
  const monthName = MONTHS[Number(month) - 1] ?? month
  return `${day} ${monthName} ${year}`
}
