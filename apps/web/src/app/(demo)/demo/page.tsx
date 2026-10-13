// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { DemoHome } from '@bankstract/demo'
import { Header, sections } from '@bankstract/marketing'

import { EventStrip } from '@/components/EventStrip'

// The hosted demo wears the marketing site's header and footer. The self-host bundle (apps/demo)
// renders DemoHome bare, with its built-in chrome.
export default function DemoPage() {
  const header = (
    <>
      <EventStrip />
      <Header />
    </>
  )
  return <DemoHome header={header} footer={<sections.Footer />} />
}
