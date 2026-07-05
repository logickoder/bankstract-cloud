// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins'
import { Resend } from 'resend'

import { db } from './db'

const resendKey = process.env.RESEND_API_KEY
const resend = resendKey ? new Resend(resendKey) : null

// Better Auth, self-hosted: users + sessions in our own libSQL DB (lib/db). Sign-in is
// Google/GitHub OAuth + email magic-link (Resend). No password, no MFA (deferred).
// Accounts auto-provision on first sign-in.
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: false },
  // BETTER_AUTH_URL is the canonical origin (prod: https://bankstract.logickoder.dev).
  // In dev the Next port varies; list localhost variants so the origin check passes.
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? ''].filter(Boolean),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    },
  },
  // Forward-looking billing fields (Paystack migration populates them later).
  user: {
    additionalFields: {
      paystackCustomerId: { type: 'string', required: false },
      subscriptionTier: { type: 'string', required: false },
      subscriptionStatus: { type: 'string', required: false },
      apiKeysIssuedAt: { type: 'string', required: false },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        const subject = 'Sign in to bankstract'
        const text = `Tap to sign in. Link expires in 15 minutes.\nIf you didn't request this, ignore the email.\n\n${url}`
        if (!resend) {
          // Dev/test: no Resend key. Log the link so the flow can proceed. In e2e,
          // MAGIC_LINK_LOG_FILE lets the test read the URL and complete sign-in.
          console.warn(`[magic-link] ${email}: ${url}`)
          const file = process.env.MAGIC_LINK_LOG_FILE
          if (file) {
            const { appendFile } = await import('node:fs/promises')
            // Prefix the email so parallel e2e workers can each pick out their own link.
            await appendFile(file, `${email} ${url}\n`)
          }
          return
        }
        await resend.emails.send({
          from: 'bankstract <noreply@contact.logickoder.dev>',
          to: email,
          subject,
          text,
        })
      },
    }),
    nextCookies(),
  ],
})
