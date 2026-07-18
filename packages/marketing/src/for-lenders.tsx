// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata, JsonLd, SITE_URL } from '@bankstract/seo'
import { Anchor, ButtonLink, Card } from '@bankstract/ui'

import { BackToHome } from './components/BackToHome'
import { CodeBlock } from './components/CodeBlock'
import { FinalCtaSection } from './components/FinalCtaSection'
import { Footer } from './components/Footer'
import { Section, SectionHeading } from './components/Section'
import { HERO_CURL } from './lib/code-samples'
import { links } from './lib/links'

const DESCRIPTION =
  'Turn Nigerian bank statement PDFs into clean transactions for underwriting. One API call. NDPR-aware redaction, open source, self-hostable. Built for lending fintechs.'

export const lendersMetadata = buildMetadata({
  title: 'Bank statement parsing API for Nigerian lenders',
  description: DESCRIPTION,
  path: '/for-lenders',
  keywords: [
    'bank statement parsing for underwriting',
    'Nigerian bank statement API',
    'lending data pipeline',
    'statement parser fintech',
    'bank statement to JSON',
  ],
})

const lendersJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'bankstract',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  description: DESCRIPTION,
  url: `${SITE_URL}/for-lenders`,
}

// Attribution: demo/signup traffic from this page carries a source tag so the funnel can attribute
// activation to it.
const DEMO = `${links.demo}?ref=for-lenders`

const TRUST: readonly { title: string; body: string; href?: string; linkText?: string }[] = [
  {
    title: 'Open source engine',
    body: 'The parser is MIT-licensed. Read it, run it, audit the exact code that touches your data.',
    href: links.engine,
    linkText: 'View the engine on GitHub',
  },
  {
    title: 'Self-hostable',
    body: 'Run the whole stack inside your own infrastructure. Nothing has to leave your network.',
    href: links.selfHost,
    linkText: 'Self-host guide',
  },
  {
    title: 'Processed in memory',
    body: 'The statement is parsed in memory. It is never written to disk and never logged.',
  },
  {
    title: 'NDPR-aware redaction',
    body: 'Names, account numbers, and BVN masked in the same call. No second pipeline.',
  },
  {
    title: 'Metadata-only audit log',
    body: 'We record that a file parsed. Never what was in it. No transactions, no balances.',
  },
]

const STEPS: readonly { n: string; title: string; body: string }[] = [
  {
    n: '01',
    title: 'Applicant uploads a statement',
    body: 'A PDF from any covered bank. The same file your underwriters read by hand today.',
  },
  {
    n: '02',
    title: 'One API call parses it',
    body: 'Transactions, balances, and account metadata come back structured and typed. Every parse runs a balance check.',
  },
  {
    n: '03',
    title: 'You underwrite on clean data',
    body: 'No fragile in-house parser to maintain. It handles the statements a direct-connect cannot reach, and the ones customers upload by hand.',
  },
]

export function LendersPage() {
  return (
    <main>
      <JsonLd data={lendersJsonLd} />

      <Section grain className="pt-8 pb-6 sm:pt-12 sm:pb-8">
        <BackToHome container={false} />
        <p className="mt-8 font-mono text-sm text-accent">For lending fintechs</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-6xl sm:tracking-[-0.04em]">
          Bank statement parsing for underwriting
        </h1>
        <p className="mt-6 max-w-xl text-lg text-fg-secondary sm:text-xl">
          Turn a Nigerian bank statement PDF into clean transactions, balances, and account metadata
          over one API call. NDPR-aware redaction in the same call.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={DEMO} reload variant="primary">
            Try the live demo
          </ButtonLink>
          <ButtonLink href={links.docs} reload variant="secondary">
            Read the docs
          </ButtonLink>
        </div>
      </Section>

      <Section className="pt-6 sm:pt-8">
        <SectionHeading>Built for a lending data pipeline</SectionHeading>
        <p className="mt-4 max-w-xl text-fg-secondary">
          The ask is to trust an API with underwriting data. Here is why you can.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST.map(({ title, body, href, linkText }) => (
            <Card key={title} className="flex flex-col">
              <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
              <p className="mt-2 text-sm text-fg-secondary">{body}</p>
              {href && linkText ? (
                <Anchor href={href} className="mt-3 text-sm">
                  {linkText}
                </Anchor>
              ) : null}
            </Card>
          ))}
        </div>
      </Section>

      <Section surface="raised">
        <SectionHeading>How it fits</SectionHeading>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <ol className="flex flex-col gap-6">
            {STEPS.map(({ n, title, body }) => (
              <li key={n} className="flex gap-4">
                <span className="font-mono text-sm text-accent">{n}</span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
                  <p className="mt-1 text-sm text-fg-secondary">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="min-w-0">
            <CodeBlock code={HERO_CURL} lang="bash" />
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading>Coverage</SectionHeading>
        <p className="mt-4 max-w-xl text-fg-secondary">
          Live today: PalmPay, First Bank, Zenith, and Opay. New banks and format drift ship in about
          48 hours. If a bank you need is not covered, that is exactly what a design partner sets the
          priority on.
        </p>
        <p className="mt-6 text-fg-secondary">
          Start on the free tier: 25 parses a month, no card. Paid tiers from{' '}
          <span className="font-mono text-fg">₦9,500</span>/mo.{' '}
          <Anchor href={links.pricing}>See pricing</Anchor>.
        </p>
      </Section>

      <FinalCtaSection />
      <Footer />
    </main>
  )
}
