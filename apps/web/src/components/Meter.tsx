// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { cn } from '@bankstract/ui'

// A share bar. With a label it is a progressbar for assistive tech; without one it is decoration
// next to a number that already says the same thing.
export function Meter({
  percent,
  label,
  className,
  fillClassName = 'bg-fg',
  trackClassName = 'bg-fg/15',
}: {
  percent: number
  label?: string
  className?: string
  fillClassName?: string
  trackClassName?: string
}) {
  return (
    <div
      {...(label
        ? { role: 'progressbar', 'aria-label': label, 'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100 }
        : { 'aria-hidden': true })}
      className={cn('w-full overflow-hidden rounded-full', trackClassName, className)}
    >
      <div className={cn('h-full rounded-full', fillClassName)} style={{ width: `${percent}%` }} />
    </div>
  )
}
