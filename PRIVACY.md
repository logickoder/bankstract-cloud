# Privacy Policy

Effective 15 July 2026.

The served copy is at [bankstract.logickoder.dev/privacy](https://bankstract.logickoder.dev/privacy). This file mirrors it for in-repo review. Keep the two in sync.

Privacy is the product. Your bank statements never have to leave your control. **PDF bytes are processed in memory and never written to disk. Statement contents are never logged or stored.**

## Who this covers

This policy covers the hosted service at `bankstract.logickoder.dev`: the API, the dashboard, and the free demo. If you self-host the open source code, you run your own instance and you are your own data controller. This policy does not apply to it.

There are two roles, depending on how you use the service.

- **The API.** When you send a statement through the API, you decide what to send and why. You are the data controller. We are a processor, acting on your request.
- **Accounts and the demo.** For your dashboard account and the anonymous demo, we decide what is collected and why. We are the controller.

## What happens to a statement

A statement you upload is read into memory, parsed, and returned to you in the API response. That is the whole path.

- We never write the PDF to disk.
- We never log statement contents.
- Transactions, balances, and account holders exist only in the response we send back. We keep none of them.
- Long parses run as background jobs. The result sits in memory for at most 5 minutes so you can fetch it, then it is cleared. It is never persisted.

## What we collect

To run the service we keep a small amount of metadata. Never the statement itself.

- **Every parse.** One row per request: a timestamp, which API key made it, the uploaded file name, the byte count, which bank parser ran, and whether it succeeded. No transaction data. The file name is whatever you named the file. If a file name identifies a person, that text is stored. Name your files plainly if this matters to you.
- **API keys.** Stored as an argon2 hash. The raw key is shown once, at creation. We cannot recover it.
- **Your account.** If you sign in to the dashboard: your email, your name and avatar from Google or GitHub if you use them, and the tokens needed to keep you signed in. Each session records the IP address and browser it came from, for security.
- **The demo.** The demo is anonymous. To stop abuse we count parses per visitor. We store a salted hash of your IP address, not the address itself, for about 60 days. Cloudflare Turnstile also checks that you are not a bot. That check sends your IP to Cloudflare. See subprocessors below.
- **Billing.** When you subscribe, your email and account id go to Paystack to open the subscription. Card details go straight to Paystack's hosted checkout. They never touch our servers. We keep your Paystack customer id, plan, and status. No card data.

## What we never collect

We do not store, log, or sell:

- transaction lines, narrations, amounts, or balances
- account holder names or account numbers from inside a statement
- BVN, or any statement contents
- card numbers

## Subprocessors

We share the minimum data needed with these services. Nothing else.

| Service | Purpose | What it receives | Region |
|---|---|---|---|
| Cloudflare | Bot check (Turnstile), TLS, docs hosting, cookieless analytics, encrypted backups | Demo visitor IP, request traffic, backup copies of our databases | US / global |
| Paystack | Subscription billing | Your email, account id, invoice amounts | Nigeria |
| Resend | Sign-in emails | Your email, the magic-link URL | US |
| Sentry | Error tracking, only if we enable it | Error events, scrubbed of request body, headers, and IP | US |
| Google, GitHub | Sign-in, only if you use them | Standard OAuth: email, name, avatar | US |
| Hetzner | Hosting and encrypted backups | The databases described above | Germany (EU) |
| Namecheap | Domain name | DNS records only | US |

## Where your data lives

Your data is hosted in Germany, in the EU, on Hetzner. Some subprocessors sit outside Nigeria and the EU. We only use services that commit to protecting the data they handle. Nigerian law, the NDPR and the Data Protection Act 2023, governs how we treat your personal data.

## How long we keep it

- **Statement contents.** Not kept. Gone when the response is sent.
- **Background job results.** At most 5 minutes, in memory.
- **Parse metadata.** 90 days, then deleted.
- **Demo rate-limit hashes.** About 60 days.
- **Account data.** Until you delete your account.
- **Backups.** Run nightly, encrypted, and roll off as the source data does.

## Your rights

Under the NDPR you can:

- see what we hold about you
- correct it
- delete it
- take it elsewhere
- object to how we use it

Delete your account from the dashboard settings at any time. It removes your account, your keys, and your sessions, and cancels any active subscription. For anything else, email **jeffery@logickoder.dev**.

## Cookies

We use two kinds of cookie. Both are necessary.

- a session cookie, so you stay signed in
- Cloudflare Turnstile cookies on the demo, for the bot check

No analytics cookies. No tracking cookies. No advertising. Our traffic analytics run through Cloudflare Web Analytics, which sets no cookies and collects no personal data.

## Bot protection

The demo uses Cloudflare Turnstile to block bots. Cloudflare processes the data it receives under its own [Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/).

## Children

The service is for businesses and developers. It is not directed at anyone under 18.

## Changes

We update this page when the service changes. The effective date at the top shows the last revision.

## Contact

Questions, or a data request? Email **jeffery@logickoder.dev**.
