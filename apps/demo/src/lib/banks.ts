// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Mirrors the engine's list_parsers() (bankstract 0.13), lowercase, as the engine
// reports them. Single source for the supported-banks pill row, the sample cycle, and
// the /api/sample allowlist. Keep in sync; don't list banks the engine can't parse.
export const SUPPORTED_BANKS = ['palmpay', 'fbn', 'opay', 'zenith'] as const

export type SupportedBank = (typeof SUPPORTED_BANKS)[number]
