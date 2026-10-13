// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BankCoverage } from './components/BankCoverage'
import { Bento } from './components/Bento'
import { ComplianceSection } from './components/ComplianceSection'
import { FailLoud } from './components/FailLoud'
import { FinalCtaSection } from './components/FinalCtaSection'
import { Footer } from './components/Footer'
import { HeroSection } from './components/HeroSection'
import { OssPrideSection } from './components/OssPrideSection'

export function MarketingHome() {
  return (
    <main>
      <HeroSection />
      <Bento />
      <FailLoud />
      <BankCoverage />
      <ComplianceSection />
      <OssPrideSection />
      <FinalCtaSection />
      <Footer />
    </main>
  )
}
