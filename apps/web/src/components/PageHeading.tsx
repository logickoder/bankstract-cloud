// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-fg">{title}</h1>
      {subtitle ? <p className="mt-2 text-fg-secondary">{subtitle}</p> : null}
    </>
  )
}
