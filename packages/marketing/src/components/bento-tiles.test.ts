// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RedactTile } from './bento-tiles'

// The tile demos redaction, so the original values must not be in the markup while it reads
// "redacted". Hiding them with transparent text would leave them in the accessibility tree and in
// copy and paste.
describe('RedactTile', () => {
  const markup = renderToStaticMarkup(createElement(RedactTile))

  it('does not ship the original values while redacted', () => {
    expect(markup).not.toContain('FOO ACME LTD')
    expect(markup).not.toContain('1111 2222 33')
    expect(markup).not.toContain('1111 2222 333')
  })

  it('tells assistive tech each field is redacted', () => {
    expect(markup.match(/Redacted/g)?.length).toBe(3)
  })
})
