// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Wordmark } from '@bankstract/ui'
import { ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'

import { SidebarNav } from '@/components/SidebarNav'
import { SignOutButton } from '@/components/sign-out-button'
import { getUser } from '@/lib/session'

// Private surface: keep it out of search indexes.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Middleware gates on cookie presence only; an expired/invalid session still reaches here and
  // would render an empty dashboard. Verify the session server-side and bounce to sign-in.
  const user = await getUser()
  if (!user) redirect('/sign-in')
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <aside className="relative flex shrink-0 flex-col gap-6 border-b border-border bg-bg-secondary px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:gap-8 lg:border-r lg:border-b-0 lg:py-8">
        <div className="relative flex items-center justify-between">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline lg:px-3"
            aria-label="bankstract home"
          >
            <Wordmark className="text-xl" />
          </Link>
          <span className="lg:hidden">
            <SignOutButton />
          </span>
        </div>
        <div className="relative">
          <SidebarNav />
        </div>
        <div className="relative mt-auto hidden flex-col gap-1 lg:flex">
          {/* /docs is a separate app, so this is a full navigation, not a client route. */}
          <a
            href="/docs"
            className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm text-fg-secondary transition-colors hover:bg-bg-tertiary hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            Docs
            <ArrowUpRight aria-hidden="true" className="size-4 text-fg-tertiary" />
          </a>
          <div className="mt-2 border-t border-border pt-4">
            {user ? (
              <p className="px-3 text-xs break-all text-fg-tertiary">{user.email}</p>
            ) : null}
            <div className="mt-1">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  )
}
