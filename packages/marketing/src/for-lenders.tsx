// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata, JsonLd, SITE_URL } from '@bankstract/seo'
import { Anchor, ButtonLink, cn, Tile } from '@bankstract/ui'

import { CodeBlock } from './components/CodeBlock'
import { FinalCtaSection } from './components/FinalCtaSection'
import { Footer } from './components/Footer'
import { SampleStatementPanel } from './components/SampleStatementPanelLoader'
import { PAGE_CONTAINER, Section, SectionHeading } from './components/Section'
import { StatementFlow } from './components/StatementFlow'
import { SHIPPED_BANKS } from './lib/banks'
import { links } from './lib/links'

const DESCRIPTION =
  'Turn Nigerian bank statement PDFs into clean transactions for underwriting. One API call. NDPR-aware redaction, open source, self-hostable. Built for lenders.'

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

// The request, shortened to fit a step tile. The full command lives in the docs and the landing.
const STEP_REQUEST = `curl -X POST /v1/parse \\
  -H "Authorization: Bearer $KEY" \\
  -F pdf=@statement.pdf`

type TrustTint = 'green' | 'peach' | 'lilac' | 'yellow' | 'plain'

// Tints and spans make the grid read as the landing's bento, not five equal cards.
const TRUST: readonly {
  title: string
  body: string
  tint: TrustTint
  wide?: boolean
  href?: string
  linkText?: string
}[] = [
  {
    title: 'Open source engine',
    tint: 'green',
    wide: true,
    body: 'The parser is MIT-licensed. Read it, run it, audit the exact code that touches your data.',
    href: links.engine,
    linkText: 'View the engine on GitHub',
  },
  {
    title: 'Self-hostable',
    tint: 'peach',
    body: 'Run the whole stack inside your own infrastructure. Nothing has to leave your network.',
    href: links.selfHost,
    linkText: 'Self-host guide',
  },
  {
    title: 'Processed in memory',
    tint: 'lilac',
    body: 'The statement is parsed in memory. It is never written to disk and never logged.',
  },
  {
    title: 'NDPR-aware redaction',
    tint: 'yellow',
    body: 'Names, account numbers, and BVN masked in the same call. No second pipeline.',
  },
  {
    title: 'Metadata-only audit log',
    tint: 'plain',
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
    body: 'Transactions, balances, and account metadata come back as structured data. Every parse runs a balance check.',
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

      <section className="wash-paper relative">
        <div className={cn(PAGE_CONTAINER, 'flex flex-col gap-12 pt-10 pb-14 sm:pt-14 sm:pb-20')}>
          <div>
            <p className="font-mono text-xs text-fg-tertiary">For lenders</p>
            <h1 className="mt-3 max-w-3xl text-5xl leading-[1.04] font-normal tracking-[-0.03em] text-fg sm:text-6xl">
              Bank statement parsing for{' '}
              <em className="font-display font-normal italic tracking-[-0.03em] text-accent-text">
                underwriting
              </em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-fg-secondary">
              Turn a Nigerian bank statement PDF into clean transactions, balances, and account
              metadata over one API call. NDPR-aware redaction in the same call.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href={DEMO} reload variant="solid">
                Try the live demo
              </ButtonLink>
              <ButtonLink href={links.docs} reload variant="secondary">
                Read the docs
              </ButtonLink>
              <Anchor href="#sample-output" className="inline-flex min-h-11 items-center text-sm">
                See a sample parse ↓
              </Anchor>
            </div>
          </div>
          <StatementFlow />
        </div>
      </section>

      <Section>
        <SectionHeading>Built for a lending data pipeline</SectionHeading>
        <p className="mt-3 max-w-xl text-lg text-fg">
          The ask is to trust an API with underwriting data. Here is why you can.
        </p>
        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {TRUST.map(({ title, body, tint, wide, href, linkText }) => (
            <Tile key={title} tint={tint} className={cn('gap-3', wide && 'lg:col-span-2')}>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="max-w-md text-fg-secondary">{body}</p>
              {href && linkText ? (
                <Anchor href={href} className="mt-auto inline-flex min-h-11 items-center text-sm">
                  {linkText}
                </Anchor>
              ) : null}
            </Tile>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading>How it fits</SectionHeading>
        <p className="mt-3 max-w-xl text-lg text-fg">One upload. One call. Data you can underwrite on.</p>
        <ol className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
          <li className="min-w-0">
            <Tile className="h-full gap-3">
              <span className="font-mono text-xs text-fg-tertiary">01</span>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                {STEPS[0]?.title}
              </h3>
              <p className="text-sm text-fg-secondary">{STEPS[0]?.body}</p>
              <p className="mt-auto pt-6 font-mono text-sm text-fg-secondary">
                statement.pdf <span className="text-fg-tertiary">→</span>
              </p>
            </Tile>
          </li>
          <li className="min-w-0">
            <Tile tint="ink" className="h-full gap-3">
              <span className="font-mono text-xs text-fg-tertiary">02</span>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                {STEPS[1]?.title}
              </h3>
              <p className="text-sm text-fg-secondary">{STEPS[1]?.body}</p>
              <div className="mt-auto pt-6 [&_.surface-ink]:p-3 [&_.surface-ink]:text-[11px]">
                <CodeBlock code={STEP_REQUEST} lang="bash" />
              </div>
            </Tile>
          </li>
          <li className="min-w-0">
            <Tile tint="green" className="h-full gap-3">
              <span className="font-mono text-xs text-fg-tertiary">03</span>
              <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                {STEPS[2]?.title}
              </h3>
              <p className="text-sm text-fg-secondary">{STEPS[2]?.body}</p>
              <dl className="mt-auto space-y-1.5 pt-6 font-mono text-sm">
                <div className="flex justify-between gap-3">
                  <dt>Transfer FOO</dt>
                  <dd>+196,533.00</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Utility ACME</dt>
                  <dd>-44,227.00</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-1.5">
                  <dt>Totals match</dt>
                  <dd>reconciled</dd>
                </div>
              </dl>
            </Tile>
          </li>
        </ol>
      </Section>

      <Section id="sample-output" className="pt-0">
        <SectionHeading>Sample output</SectionHeading>
        <p className="mt-3 max-w-xl text-fg-secondary">
          Not a parse of a real statement. This is the shape every real parse comes back in.
        </p>
        <div className="mt-8">
          <SampleStatementPanel />
        </div>
      </Section>

      <Section className="pt-0">
        <SectionHeading>Coverage</SectionHeading>
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          <Tile tint="green" className="gap-4">
            <p className="font-mono text-xs text-fg-tertiary">live today</p>
            <p className="font-mono text-3xl tracking-[-0.04em] sm:text-4xl">
              {SHIPPED_BANKS.map((bank) => bank.id).join(', ')}
            </p>
            <p className="max-w-md text-fg-secondary">
              If a live bank changes its layout, the fix ships within 48h.
            </p>
          </Tile>
          <Tile className="gap-4">
            <p className="font-mono text-xs text-fg-tertiary">your bank?</p>
            <p className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Not covered? Tell us.
            </p>
            <p className="max-w-md text-fg-secondary">
              That is exactly what a design partner sets the priority on.
            </p>
            <ButtonLink href={links.sponsoredBank} variant="secondary" className="mt-auto self-start">
              Sponsor a parser
            </ButtonLink>
          </Tile>
        </div>
      </Section>

      <FinalCtaSection />
      <Footer />
    </main>
  )
}
