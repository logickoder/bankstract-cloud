// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { JsonLd, metadata } from '@bankstract/demo'

export { metadata }

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd />
      <div className="grain-fixed" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </>
  )
}
