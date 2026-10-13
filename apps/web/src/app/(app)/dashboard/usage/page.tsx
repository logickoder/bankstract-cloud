// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { displayDate, displayMoney } from '@bankstract/format'
import { Card } from '@bankstract/ui'

import { Meter } from '@/components/Meter'
import { PageHeading } from '@/components/PageHeading'
import { Refusals, totalRefused } from '@/components/Refusals'
import { StatusTile } from '@/components/StatusTile'
import { Unavailable } from '@/components/Unavailable'
import { UsageChart, UsageChartSkeleton } from '@/components/UsageChart'
import { fetchUsage, hasUsageData } from '@/lib/dashboard-data'
import { overageTone, SUCCESS_FLOOR, successTone, usagePercent, usageTone } from '@/lib/tone'
import { summarize } from '@/lib/usage-stats'

export default async function UsagePage() {
  const usage = await fetchUsage()
  if (usage === null) {
    return (
      <div>
        <PageHeading title="Usage" subtitle="Successful parses this cycle, by day. A cycle is a UTC calendar month." />
        <Unavailable what="Your usage is" />
      </div>
    )
  }
  const hasData = hasUsageData(usage)
  const parses = usage.period_parses
  const cap = usage.monthly_cap
  const usedPct = usagePercent(parses, cap)
  const stats = summarize(hasData ? usage.daily : [])
  const attempts = hasData ? parses + totalRefused(usage.refusals) : 0
  const usageStatus = usageTone({ parses, cap, overage: usage.overage_parses })
  const successStatus = hasData
    ? successTone({
        rate: usage.success_rate,
        attempts,
      })
    : 'neutral'

  return (
    <div>
      <PageHeading title="Usage" subtitle="Successful parses this cycle, by day. A cycle is a UTC calendar month." />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatusTile tone={usageStatus}>
          <p className="font-mono text-xs text-fg-tertiary">parses this cycle</p>
          <p className="mt-2 font-mono text-4xl tracking-[-0.04em]">
            {parses.toLocaleString()}
            {cap !== null ? (
              <span className="ml-1 text-base text-fg-tertiary">/ {cap.toLocaleString()}</span>
            ) : null}
          </p>
          {usedPct !== null ? (
            <Meter percent={usedPct} label="Included parses used this cycle" className="mt-4 h-1.5" />
          ) : null}
          {cap !== null ? (
            <p className="mt-2 text-xs text-fg-secondary">
              Cap resets on the 1st, UTC.{usageStatus === 'warn' ? ' Close to your cap.' : ''}
            </p>
          ) : null}
        </StatusTile>
        <StatusTile tone={successStatus}>
          <p className="font-mono text-xs text-fg-tertiary">success rate</p>
          <p className="mt-2 font-mono text-4xl tracking-[-0.04em]">
            {hasData && attempts > 0 ? `${Math.round(usage.success_rate * 100)}%` : 'n/a'}
          </p>
          {successStatus === 'alert' ? (
            <p className="mt-2 text-xs text-fg-secondary">
              Below {Math.round(SUCCESS_FLOOR * 100)}%. See the refusals below.
            </p>
          ) : null}
        </StatusTile>
        <StatusTile tone={overageTone(usage.overage_parses)}>
          <p className="font-mono text-xs text-fg-tertiary">projected overage</p>
          {cap !== null ? (
            <>
              <p className="mt-2 font-mono text-4xl tracking-[-0.04em]">
                ₦{displayMoney(usage.projected_overage_naira)}
              </p>
              <p className="mt-2 text-xs text-fg-secondary">
                {usage.overage_parses.toLocaleString()} parses over cap
              </p>
            </>
          ) : (
            <p className="mt-2 font-mono text-4xl tracking-[-0.04em] text-fg-tertiary">n/a</p>
          )}
        </StatusTile>
      </div>

      <Card className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-fg">Daily parses</h2>
          {hasData && stats.peak ? (
            <p className="font-mono text-xs text-fg-tertiary">
              busiest {stats.peak.count.toLocaleString()} on {displayDate(stats.peak.date)} · total{' '}
              {stats.total.toLocaleString()}
            </p>
          ) : null}
        </div>
        <div className="mt-5">
          {hasData ? (
            <UsageChart daily={usage.daily} />
          ) : (
            <UsageChartSkeleton label="No parses this cycle yet." />
          )}
        </div>
        {hasData && stats.total === 0 ? (
          <p className="mt-3 text-sm text-fg-tertiary">No parses this cycle yet. They show up here.</p>
        ) : null}
      </Card>

      <Refusals refusals={usage.refusals} />
    </div>
  )
}
