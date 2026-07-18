// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/SignInForm'
import { getUser } from '@/lib/session'

export default async function SignUpPage() {
  if (await getUser()) redirect('/dashboard')
  return <SignInForm title="Create account" />
}
