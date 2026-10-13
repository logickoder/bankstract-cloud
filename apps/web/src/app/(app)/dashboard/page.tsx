// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { displayDate, displayMoney } from '@bankstract/format'
import { Button, Card, linkClass } from '@bankstract/ui'
import Link from 'next/link'

import { StatusBadge, TierBadge } from '@/components/KeyBadges'
import { PageHeading } from '@/components/PageHeading'
import { totalRefused } from '@/components/Refusals'
import { StatusTile } from '@/components/StatusTile'
import { Unavailable } from '@/components/Unavailable'
import { summarize, UsageCalendar, UsageCalendarSkeleton } from '@/components/UsageCalendar'
import { fetchKeys, fetchUsage, hasUsageData } from '@/lib/dashboard-data'
import { keysTone, SUCCESS_FLOOR, successTone, usageTone } from '@/lib/tone'

const ENDPOINT = 'https://bankstract.logickoder.dev/v1/parse'

export default async function OverviewPage() {
  const [usage, keys] = await Promise.all([fetchUsage(), fetchKeys()])
  // Could not ask is not the same as none. Never render zeros or "no key" for an outage.
  if (usage === null || keys === null) {
    return (
      <div>
        <PageHeading title="Overview" subtitle="Usage for the current cycle." />
        <Unavailable what="Your usage and keys are" />
      </div>
    )
  }
  const activeKeys = keys.filter((k) => !k.revoked_at).length
  const hasUsage = hasUsageData(usage)
  const recent = keys.slice(0, 3)

  const parses = usage?.period_parses ?? 0
  const cap = usage?.monthly_cap ?? null
  const usedPct = cap ? Math.min(100, Math.round((parses / cap) * 100)) : null
  const daily = hasUsage ? usage.daily : []
  const stats = summarize(daily)
  const refused = totalRefused(usage?.refusals ?? [])
  // A success rate needs something to be a rate of: with no attempts the worker reports 0%, which
  // would read as "everything failed".
  const attempts = parses + refused
  // Onboarding steps are for someone who has not yet gone live: no active live key, or nothing
  // parsed this cycle. Once they have, the tile is noise next to the real numbers.
  const onboarded = parses > 0 && keys.some((k) => k.tier === 'live' && !k.revoked_at)
  const usageStatus = usageTone({ parses, cap, overage: usage?.overage_parses ?? 0 })
  const successStatus = hasUsage
    ? successTone({ rate: usage.success_rate, attempts })
    : 'neutral'

  return (
    <div>
      <PageHeading title="Overview" subtitle="Usage for the current cycle." />

      <div className="mt-8 grid gap-3 lg:grid-cols-[1.7fr_1fr]">
        <StatusTile tone={usageStatus} className="flex flex-col sm:p-8">
          <p className="font-mono text-xs text-fg-tertiary">parses this cycle</p>
          <p className="mt-3 font-mono tracking-[-0.04em]">
            <span className="text-6xl sm:text-7xl">{parses.toLocaleString()}</span>
            {cap !== null ? (
              <span className="ml-2 text-xl text-fg-tertiary">/ {cap.toLocaleString()}</span>
            ) : null}
          </p>
          {usedPct !== null ? (
            <div className="mt-6">
              <div
                role="progressbar"
                aria-label="Included parses used this cycle"
                aria-valuenow={usedPct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-full overflow-hidden rounded-full bg-fg/15"
              >
                <div className="h-full rounded-full bg-fg" style={{ width: `${usedPct}%` }} />
              </div>
              <p className="mt-2 text-sm text-fg-secondary">
                {usedPct}% of included parses used.
                {usageStatus === 'warn' ? ' Close to your cap.' : ''}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-fg-secondary">
              No paid plan yet.{' '}
              <Link href="/dashboard/billing" className="font-medium underline underline-offset-4">
                Pick one on Billing
              </Link>
              .
            </p>
          )}
          {usage && usage.overage_parses > 0 ? (
            <p className="mt-4 text-sm text-fg">
              {usage.overage_parses.toLocaleString()} over your cap. Projected overage{' '}
              <span className="font-mono">₦{displayMoney(usage.projected_overage_naira)}</span>.{' '}
              <Link href="/dashboard/billing" className="font-medium underline underline-offset-4">
                Manage plan
              </Link>
            </p>
          ) : null}
        </StatusTile>

        <div className="grid gap-3">
          <StatusTile tone={successStatus}>
            <p className="font-mono text-xs text-fg-tertiary">success rate</p>
            <p className="mt-2 font-mono text-4xl tracking-[-0.04em]">
              {hasUsage && attempts > 0 ? `${Math.round(usage.success_rate * 100)}%` : 'n/a'}
            </p>
            {hasUsage ? (
              <p className="mt-2 text-sm text-fg-secondary">
                {successStatus === 'alert' ? `Below ${Math.round(SUCCESS_FLOOR * 100)}%. ` : ''}
                {attempts === 0 ? (
                  'No parses yet.'
                ) : refused === 0 ? (
                  'Nothing refused this cycle.'
                ) : (
                  <>
                    {refused.toLocaleString()} refused.{' '}
                    <Link
                      href="/dashboard/usage#refusals"
                      className="font-medium underline underline-offset-4"
                    >
                      See why
                    </Link>
                  </>
                )}
              </p>
            ) : null}
          </StatusTile>
          <StatusTile tone={keysTone(activeKeys)}>
            <p className="font-mono text-xs text-fg-tertiary">active keys</p>
            <p className="mt-2 flex items-end justify-between gap-3">
              <span className="font-mono text-4xl tracking-[-0.04em]">{activeKeys}</span>
              <Link href="/dashboard/keys" className="text-sm font-medium underline underline-offset-4">
                Manage
              </Link>
            </p>
            {activeKeys === 0 ? (
              <p className="mt-2 text-sm text-fg-secondary">No key can parse. Create one.</p>
            ) : null}
          </StatusTile>
        </div>
      </div>

      <Card className="mt-3">
        <h2 className="font-display text-lg font-semibold text-fg">Daily parses</h2>
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
          <div>
            {hasUsage && daily.length ? <UsageCalendar daily={daily} /> : <UsageCalendarSkeleton />}
          </div>
          <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-5 lg:grid-cols-1">
            {hasUsage && daily.length && stats.total > 0 ? (
              <>
                <Stat label="total" value={stats.total.toLocaleString()} />
                <Stat
                  label="busiest day"
                  value={stats.peak ? stats.peak.count.toLocaleString() : '0'}
                  sub={stats.peak ? displayDate(stats.peak.date) : undefined}
                />
                <Stat label="average a day" value={stats.average.toLocaleString()} />
                <Stat label="days with parses" value={`${stats.activeDays} of ${daily.length}`} />
              </>
            ) : (
              <p className="col-span-2 text-sm text-fg-tertiary lg:col-span-1">
                No parses this cycle yet. Your first one shows up here.
              </p>
            )}
          </dl>
        </div>
      </Card>

      <div className={`mt-3 grid gap-3 ${onboarded ? '' : 'lg:grid-cols-2'}`}>
        {onboarded ? null : (
        <section className="surface-ink flex min-w-0 flex-col rounded-lg p-6">
          <h2 className="font-display text-lg font-semibold">Get started</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-4 text-sm text-fg-secondary">
            <li>Create an API key.</li>
            <li>Call /v1/parse with it.</li>
            <li>Get clean transactions back.</li>
          </ol>
          <pre className="mt-4 min-w-0 overflow-x-auto rounded-md bg-bg-tertiary p-3 font-mono text-xs text-fg-secondary">
            {`curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer bsk_..." \\
  -F "pdf=@statement.pdf"`}
          </pre>
          <Link href={keys.length ? '/dashboard/keys' : '/dashboard/keys?create=1'} className="mt-4">
            <Button size="sm" className="bg-fg text-bg">
              {keys.length ? 'Manage keys' : 'Create your first key'}
            </Button>
          </Link>
        </section>
        )}

        <Card className="min-w-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-fg">Recent keys</h2>
            <Link href="/dashboard/keys" className={`text-sm ${linkClass}`}>
              View all
            </Link>
          </div>
          {recent.length ? (
            <ul className="mt-4 flex flex-col divide-y divide-border/60">
              {recent.map((k) => (
                <li key={k.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-fg">{k.name}</div>
                    <div className="font-mono text-xs text-fg-tertiary">{k.prefix}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <TierBadge tier={k.tier} />
                    <StatusBadge revoked={Boolean(k.revoked_at)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-fg-tertiary">No keys yet. Create one to start.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="font-mono text-xs text-fg-tertiary">{label}</dt>
      <dd className="mt-1 font-mono text-2xl tracking-[-0.03em] text-fg">{value}</dd>
      {sub ? <dd className="mt-0.5 font-mono text-xs text-fg-tertiary">{sub}</dd> : null}
    </div>
  )
}
