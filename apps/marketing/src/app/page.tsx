// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BankCoverage } from '../components/BankCoverage'
import { CodeFeatureSection } from '../components/CodeFeatureSection'
import { CodeTabsSection } from '../components/CodeTabsSection'
import { ComplianceSection } from '../components/ComplianceSection'
import { FeatureGrid } from '../components/FeatureGrid'
import { FinalCtaSection } from '../components/FinalCtaSection'
import { Footer } from '../components/Footer'
import { HeroSection } from '../components/HeroSection'
import { OssPrideSection } from '../components/OssPrideSection'
import { PricingSection } from '../components/PricingSection'
import { TransformationDemo } from '../components/TransformationDemo'

export default function Page() {
  return (
    <main>
      <HeroSection />
      <CodeTabsSection />
      <TransformationDemo />
      <FeatureGrid />
      <CodeFeatureSection />
      <BankCoverage />
      <ComplianceSection />
      <OssPrideSection />
      <PricingSection />
      <FinalCtaSection />
      <Footer />
    </main>
  )
}
