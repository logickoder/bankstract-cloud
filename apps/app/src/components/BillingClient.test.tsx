// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BillingClient } from './BillingClient'

import type { SubscriptionStatusResponse } from '@/lib/worker'

function stubLocation(): { href: string } {
  const loc = { href: '' }
  Object.defineProperty(window, 'location', { value: loc, writable: true })
  return loc
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('BillingClient', () => {
  it('renders the three tier cards when there is no active subscription', () => {
    render(<BillingClient status={null} />)

    expect(screen.getByRole('heading', { name: 'Starter' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Growth' })).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Scale' })).toBeDefined()
    expect(screen.getAllByRole('button', { name: /subscribe/i })).toHaveLength(3)
  })

  it('renders naira prices in JetBrains Mono (font-mono)', () => {
    render(<BillingClient status={null} />)

    const price = screen.getByText('₦9,500')
    expect(price.className).toContain('font-mono')
  })

  it('starts checkout and redirects to the authorization_url', async () => {
    const loc = stubLocation()
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ authorization_url: 'https://paystack.test/checkout' }), {
        status: 200,
      }),
    )
    render(<BillingClient status={null} />)

    const growthCard = screen.getByRole('heading', { name: 'Growth' }).closest('div')!
    await userEvent.click(within(growthCard).getByRole('button', { name: /subscribe/i }))

    await waitFor(() => expect(loc.href).toBe('https://paystack.test/checkout'))
    const [, init] = vi.mocked(fetch).mock.calls[0]!
    expect(typeof init?.body).toBe('string')
    expect(JSON.parse(init!.body as string)).toEqual({ tier: 'growth', interval: 'monthly' })
  })

  it('shows an error and does not redirect when checkout init fails', async () => {
    const loc = stubLocation()
    vi.mocked(fetch).mockResolvedValue(new Response('nope', { status: 500 }))
    render(<BillingClient status={null} />)

    await userEvent.click(screen.getAllByRole('button', { name: /subscribe/i })[0]!)

    expect(await screen.findByText(/could not start checkout/i)).toBeDefined()
    expect(loc.href).toBe('')
  })

  it('shows annual prices after toggling to Annual', async () => {
    render(<BillingClient status={null} />)
    await userEvent.click(screen.getByRole('button', { name: /annual/i }))
    expect(screen.getByText('₦96,900')).toBeDefined()
    expect(screen.queryByText('₦9,500')).toBeNull()
  })

  it('posts the selected interval on subscribe', async () => {
    const loc = stubLocation()
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ authorization_url: 'https://paystack.test/checkout' }), {
        status: 200,
      }),
    )
    render(<BillingClient status={null} />)

    await userEvent.click(screen.getByRole('button', { name: /annual/i }))
    const starterCard = screen.getByRole('heading', { name: 'Starter' }).closest('div')!
    await userEvent.click(within(starterCard).getByRole('button', { name: /subscribe/i }))

    await waitFor(() => expect(loc.href).toBe('https://paystack.test/checkout'))
    const [, init] = vi.mocked(fetch).mock.calls[0]!
    expect(JSON.parse(init!.body as string)).toEqual({ tier: 'starter', interval: 'annual' })
  })

  it('renders the current-plan card when the subscription is active', () => {
    const status: SubscriptionStatusResponse = {
      owner: 'user_1',
      tier: 'starter',
      status: 'active',
      current_period_end: '2026-07-01T00:00:00Z',
    }
    render(<BillingClient status={status} />)

    expect(screen.getByText('Starter')).toBeDefined()
    expect(screen.getByText('active')).toBeDefined()
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull()
  })
})
