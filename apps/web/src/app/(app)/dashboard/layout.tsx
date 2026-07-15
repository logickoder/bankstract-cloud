// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BrandMark } from '@bankstract/ui'
import type { Metadata } from 'next'
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
  const user = await getUser()
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <aside className="relative flex shrink-0 flex-col gap-6 overflow-hidden border-b border-border bg-bg-secondary px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:gap-8 lg:border-r lg:border-b-0 lg:py-8">
        <div className="grain-section" aria-hidden="true" />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-lg font-bold text-fg">
            <BrandMark className="h-2.5 w-auto" />
            bankstract
          </span>
          <span className="lg:hidden">
            <SignOutButton />
          </span>
        </div>
        <div className="relative">
          <SidebarNav />
        </div>
        <div className="relative mt-auto hidden items-center justify-between gap-2 border-t border-border pt-4 lg:flex">
          {user ? (
            <span
              className="min-w-0 flex-1 truncate text-xs text-fg-tertiary"
              title={user.email}
            >
              {user.email}
            </span>
          ) : null}
          <SignOutButton />
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
