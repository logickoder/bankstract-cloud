// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/SignInForm'
import { getUser } from '@/lib/session'

export default async function SignInPage() {
  // Already signed in: skip the form, go straight to the dashboard.
  if (await getUser()) redirect('/dashboard')
  return <SignInForm title="Sign in" />
}
