// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { JsonLd } from '@bankstract/seo'
import { describe, expect, test } from 'vitest'

describe('shared seo JsonLd', () => {
  test('emits a schema.org script tag with the serialized graph', () => {
    const el = JsonLd({ data: { '@type': 'SoftwareApplication', name: 'bankstract' } })
    const props = el.props as { type: string; dangerouslySetInnerHTML: { __html: string } }
    expect(el.type).toBe('script')
    expect(props.type).toBe('application/ld+json')
    expect(JSON.parse(props.dangerouslySetInnerHTML.__html)).toEqual({
      '@type': 'SoftwareApplication',
      name: 'bankstract',
    })
  })
})
