// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { ApiKeyIcon, Button, Card, linkClass, UsageIcon } from '@bankstract/ui'
import { CircleCheck } from 'lucide-react'
import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'

import { EnvBadge, StatusBadge } from '@/components/KeyBadges'
import { PageHeading } from '@/components/PageHeading'
import { UsageChart, UsageChartSkeleton } from '@/components/UsageChart'
import { fetchKeys, fetchUsage, hasUsageData } from '@/lib/dashboard-data'

const ENDPOINT = 'https://bankstract.logickoder.dev/v1/parse'

export default async function OverviewPage() {
  const [usage, keys] = await Promise.all([fetchUsage(), fetchKeys()])
  const activeKeys = keys.filter((k) => !k.revoked_at).length
  const hasUsage = hasUsageData(usage)
  const recent = keys.slice(0, 3)

  const cap = usage?.monthly_cap ?? null
  type StatIcon = ComponentType<SVGProps<SVGSVGElement>>
  const cards: { icon: StatIcon; label: string; value: string; sub?: string }[] = [
    {
      icon: UsageIcon,
      label: 'Parses this cycle',
      value: String(usage?.period_parses ?? 0),
      sub: cap !== null ? `of ${cap.toLocaleString()} included` : undefined,
    },
    {
      icon: CircleCheck,
      label: 'Success rate',
      value: hasUsage ? `${Math.round(usage.success_rate * 100)}%` : 'n/a',
    },
    { icon: ApiKeyIcon, label: 'Active keys', value: String(activeKeys) },
  ]

  return (
    <div>
      <PageHeading title="Overview" subtitle="Usage for the current cycle." />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map(({ icon: Icon, label, value, sub }) => (
          <Card key={label}>
            <dl>
              <dt className="flex items-center gap-2 text-sm text-fg-secondary">
                <Icon className="size-4 text-accent" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-3 font-mono text-3xl text-fg">{value}</dd>
              {sub ? <dd className="mt-1 text-xs text-fg-tertiary">{sub}</dd> : null}
            </dl>
          </Card>
        ))}
      </div>

      {usage && usage.overage_parses > 0 ? (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-accent/40">
          <p className="text-sm text-fg-secondary">
            <span className="text-fg">{usage.overage_parses.toLocaleString()}</span> parses over your
            cap this cycle. Projected overage{' '}
            <span className="font-mono text-fg">₦{usage.projected_overage_naira}</span>.
          </p>
          <Link href="/dashboard/billing" className={`text-sm ${linkClass}`}>
            Manage plan
          </Link>
        </Card>
      ) : null}

      <Card className="mt-4">
        <div className="text-sm text-fg-secondary">Daily parses</div>
        <div className="mt-4">
          {hasUsage ? (
            <UsageChart daily={usage.daily} />
          ) : (
            <UsageChartSkeleton label="No parses this cycle yet." />
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="flex min-w-0 flex-col">
          <h2 className="font-display text-lg font-semibold text-fg">Get started</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-4 text-sm text-fg-secondary">
            <li>Create an API key.</li>
            <li>Call /v1/parse with it.</li>
            <li>Get clean transactions back.</li>
          </ol>
          <pre className="mt-4 min-w-0 overflow-x-auto rounded-md border border-bg-tertiary bg-bg-tertiary p-3 font-mono text-xs text-fg-secondary">
            {`curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer bsk_..." \\
  -F "pdf=@statement.pdf"`}
          </pre>
          <Link href={keys.length ? '/dashboard/keys' : '/dashboard/keys?create=1'} className="mt-4">
            <Button size="sm">{keys.length ? 'Manage keys' : 'Create your first key'}</Button>
          </Link>
        </Card>

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
                    <EnvBadge env={k.env} />
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
