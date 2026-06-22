// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Card } from '@bankstract/ui'

import { PageHeading } from '@/components/PageHeading'
import { UsageChart, UsageChartSkeleton } from '@/components/UsageChart'
import { fetchUsage } from '@/lib/dashboard-data'

export default async function UsagePage() {
  const usage = await fetchUsage()
  const hasData = usage && usage.daily.length > 0

  return (
    <div>
      <PageHeading title="Usage" subtitle="Successful parses this cycle, by day." />

      <Card className="mt-8">
        {hasData ? (
          <UsageChart daily={usage.daily} />
        ) : (
          <UsageChartSkeleton label="No parses this cycle yet." />
        )}
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-sm text-fg-secondary">Parses this cycle</div>
          <div className="mt-2 font-mono text-2xl text-fg">
            {(usage?.period_parses ?? 0).toLocaleString()}
            {usage?.monthly_cap != null ? (
              <span className="text-base text-fg-tertiary">
                {' / '}
                {usage.monthly_cap.toLocaleString()}
              </span>
            ) : null}
          </div>
          {usage?.monthly_cap != null ? (
            <div className="mt-1 text-xs text-fg-tertiary">cap resets on the 1st</div>
          ) : null}
        </Card>
        <Card>
          <div className="text-sm text-fg-secondary">Success rate</div>
          <div className="mt-2 font-mono text-2xl text-fg">
            {hasData ? `${Math.round(usage.success_rate * 100)}%` : 'n/a'}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-fg-secondary">Projected overage</div>
          {usage?.monthly_cap != null ? (
            <>
              <div className="mt-2 font-mono text-2xl text-fg">
                ₦{usage.projected_overage_naira}
              </div>
              <div className="mt-1 text-xs text-fg-tertiary">
                {usage.overage_parses.toLocaleString()} parses over cap
              </div>
            </>
          ) : (
            <div className="mt-2 font-mono text-2xl text-fg-tertiary">n/a</div>
          )}
        </Card>
      </div>
    </div>
  )
}
