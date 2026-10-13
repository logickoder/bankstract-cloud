// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Header, JsonLd } from '@bankstract/marketing'

import { EventStrip } from '@/components/EventStrip'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd />
      <EventStrip />
      <Header />
      {children}
    </>
  )
}
