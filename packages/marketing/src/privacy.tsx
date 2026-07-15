// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { buildMetadata } from '@bankstract/seo'
import { Anchor, cn } from '@bankstract/ui'
import type { ReactNode } from 'react'

import { Footer } from './components/Footer'
import { PAGE_CONTAINER } from './components/Section'

const CONTACT = 'jeffery@logickoder.dev'
const TURNSTILE_ADDENDUM = 'https://www.cloudflare.com/turnstile-privacy-policy/'

export const privacyMetadata = buildMetadata({
  title: 'Privacy',
  description:
    'How the bankstract hosted service handles your data. Statements are processed in memory and never written to disk. Metadata only, no statement contents.',
  path: '/privacy',
  keywords: ['bankstract privacy', 'NDPR', 'data protection', 'statement parsing privacy'],
})

function Policy({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-fg">{title}</h2>
      <div className="flex flex-col gap-3 leading-relaxed text-fg-secondary">{children}</div>
    </section>
  )
}

const SUBPROCESSORS: readonly { name: string; purpose: string; data: string; region: string }[] = [
  {
    name: 'Cloudflare',
    purpose: 'Bot check (Turnstile), TLS, docs hosting, encrypted backups',
    data: 'Demo visitor IP, request traffic, backup copies of our databases',
    region: 'US / global',
  },
  {
    name: 'Paystack',
    purpose: 'Subscription billing',
    data: 'Your email, account id, invoice amounts',
    region: 'Nigeria',
  },
  {
    name: 'Resend',
    purpose: 'Sign-in emails',
    data: 'Your email, the magic-link URL',
    region: 'US',
  },
  {
    name: 'Sentry',
    purpose: 'Error tracking, only if we enable it',
    data: 'Error events, scrubbed of request body, headers, and IP',
    region: 'US',
  },
  {
    name: 'Google, GitHub',
    purpose: 'Sign-in, only if you use them',
    data: 'Standard OAuth: email, name, avatar',
    region: 'US',
  },
  {
    name: 'Hetzner',
    purpose: 'Hosting and encrypted backups',
    data: 'The databases described above',
    region: 'Germany (EU)',
  },
  {
    name: 'Namecheap',
    purpose: 'Domain name',
    data: 'DNS records only',
    region: 'US',
  },
]

export function PrivacyPage() {
  return (
    <main>
      <div className={cn(PAGE_CONTAINER, 'pt-8')}>
        <Anchor href="/">← bankstract</Anchor>
      </div>

      <div className={cn(PAGE_CONTAINER, 'py-12 sm:py-16')}>
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Privacy</p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-fg sm:text-5xl">
            Privacy policy
          </h1>
          <p className="text-sm text-fg-tertiary">Effective 15 July 2026.</p>
          <p className="max-w-2xl text-lg leading-relaxed text-fg-secondary">
            Privacy is the product. Your bank statements never have to leave your control. PDF bytes
            are processed in memory and never written to disk. Statement contents are never logged or
            stored.
          </p>
        </header>

        <div className="mt-12 flex max-w-2xl flex-col gap-10">
          <Policy title="Who this covers">
            <p>
              This policy covers the hosted service at bankstract.logickoder.dev: the API, the
              dashboard, and the free demo. If you self-host the open source code, you run your own
              instance and you are your own data controller. This policy does not apply to it.
            </p>
            <p>There are two roles, depending on how you use the service.</p>
            <ul className="flex flex-col gap-2">
              <li>
                <span className="text-fg">The API.</span> When you send a statement through the API,
                you decide what to send and why. You are the data controller. We are a processor,
                acting on your request.
              </li>
              <li>
                <span className="text-fg">Accounts and the demo.</span> For your dashboard account
                and the anonymous demo, we decide what is collected and why. We are the controller.
              </li>
            </ul>
          </Policy>

          <Policy title="What happens to a statement">
            <p className="text-fg">
              A statement you upload is read into memory, parsed, and returned to you in the API
              response. That is the whole path.
            </p>
            <ul className="flex flex-col gap-2">
              <li>We never write the PDF to disk.</li>
              <li>We never log statement contents.</li>
              <li>
                Transactions, balances, and account holders exist only in the response we send back.
                We keep none of them.
              </li>
              <li>
                Long parses run as background jobs. The result sits in memory for at most 5 minutes
                so you can fetch it, then it is cleared. It is never persisted.
              </li>
            </ul>
          </Policy>

          <Policy title="What we collect">
            <p>To run the service we keep a small amount of metadata. Never the statement itself.</p>
            <p>
              <span className="text-fg">Every parse.</span> One row per request: a timestamp, which
              API key made it, the uploaded file name, the byte count, which bank parser ran, and
              whether it succeeded. No transaction data. The file name is whatever you named the
              file. If a file name identifies a person, that text is stored. Name your files plainly
              if this matters to you.
            </p>
            <p>
              <span className="text-fg">API keys.</span> Stored as an argon2 hash. The raw key is
              shown once, at creation. We cannot recover it.
            </p>
            <p>
              <span className="text-fg">Your account.</span> If you sign in to the dashboard: your
              email, your name and avatar from Google or GitHub if you use them, and the tokens
              needed to keep you signed in. Each session records the IP address and browser it came
              from, for security.
            </p>
            <p>
              <span className="text-fg">The demo.</span> The demo is anonymous. To stop abuse we
              count parses per visitor. We store a salted hash of your IP address, not the address
              itself, for about 60 days. Cloudflare Turnstile also checks that you are not a bot.
              That check sends your IP to Cloudflare. See subprocessors below.
            </p>
            <p>
              <span className="text-fg">Billing.</span> When you subscribe, your email and account id
              go to Paystack to open the subscription. Card details go straight to Paystack&apos;s
              hosted checkout. They never touch our servers. We keep your Paystack customer id, plan,
              and status. No card data.
            </p>
          </Policy>

          <Policy title="What we never collect">
            <p>We do not store, log, or sell:</p>
            <ul className="flex flex-col gap-2">
              <li>transaction lines, narrations, amounts, or balances</li>
              <li>account holder names or account numbers from inside a statement</li>
              <li>BVN, or any statement contents</li>
              <li>card numbers</li>
            </ul>
          </Policy>

          <Policy title="Subprocessors">
            <p>We share the minimum data needed with these services. Nothing else.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-fg-tertiary">
                    <th className="py-2 pr-4 font-normal">Service</th>
                    <th className="py-2 pr-4 font-normal">Purpose</th>
                    <th className="py-2 pr-4 font-normal">What it receives</th>
                    <th className="py-2 font-normal">Region</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((s) => (
                    <tr key={s.name} className="border-b border-border/60 align-top">
                      <td className="py-3 pr-4 text-fg">{s.name}</td>
                      <td className="py-3 pr-4 text-fg-secondary">{s.purpose}</td>
                      <td className="py-3 pr-4 text-fg-secondary">{s.data}</td>
                      <td className="py-3 text-fg-secondary">{s.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Policy>

          <Policy title="Where your data lives">
            <p>
              Your data is hosted in Germany, in the EU, on Hetzner. Some subprocessors sit outside
              Nigeria and the EU. We only use services that commit to protecting the data they
              handle. Nigerian law, the NDPR and the Data Protection Act 2023, governs how we treat
              your personal data.
            </p>
          </Policy>

          <Policy title="How long we keep it">
            <ul className="flex flex-col gap-2">
              <li>
                <span className="text-fg">Statement contents.</span> Not kept. Gone when the response
                is sent.
              </li>
              <li>
                <span className="text-fg">Background job results.</span> At most 5 minutes, in
                memory.
              </li>
              <li>
                <span className="text-fg">Parse metadata.</span> 90 days, then deleted.
              </li>
              <li>
                <span className="text-fg">Demo rate-limit hashes.</span> About 60 days.
              </li>
              <li>
                <span className="text-fg">Account data.</span> Until you delete your account.
              </li>
              <li>
                <span className="text-fg">Backups.</span> Run nightly, encrypted, and roll off as the
                source data does.
              </li>
            </ul>
          </Policy>

          <Policy title="Your rights">
            <p>Under the NDPR you can:</p>
            <ul className="flex flex-col gap-2">
              <li>see what we hold about you</li>
              <li>correct it</li>
              <li>delete it</li>
              <li>take it elsewhere</li>
              <li>object to how we use it</li>
            </ul>
            <p>
              Delete your account from the dashboard settings at any time. It removes your account,
              your keys, and your sessions, and cancels any active subscription. For anything else,
              email <Anchor href={`mailto:${CONTACT}`}>{CONTACT}</Anchor>.
            </p>
          </Policy>

          <Policy title="Cookies">
            <p>We use two kinds of cookie. Both are necessary.</p>
            <ul className="flex flex-col gap-2">
              <li>a session cookie, so you stay signed in</li>
              <li>Cloudflare Turnstile cookies on the demo, for the bot check</li>
            </ul>
            <p>No analytics cookies. No tracking cookies. No advertising.</p>
          </Policy>

          <Policy title="Bot protection">
            <p>
              The demo uses Cloudflare Turnstile to block bots. Cloudflare processes the data it
              receives under its own{' '}
              <Anchor href={TURNSTILE_ADDENDUM}>Turnstile Privacy Addendum</Anchor>.
            </p>
          </Policy>

          <Policy title="Children">
            <p>
              The service is for businesses and developers. It is not directed at anyone under 18.
            </p>
          </Policy>

          <Policy title="Changes">
            <p>
              We update this page when the service changes. The effective date at the top shows the
              last revision.
            </p>
          </Policy>

          <Policy title="Contact">
            <p>
              Questions, or a data request? Email{' '}
              <Anchor href={`mailto:${CONTACT}`}>{CONTACT}</Anchor>.
            </p>
          </Policy>
        </div>
      </div>

      <Footer />
    </main>
  )
}
