// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Button, linkClass } from '@bankstract/ui'

import { type DemoErrorCode, ERROR_ACTION, ERROR_COPY, tooLargeCopy } from '../lib/errors'

export function ErrorPanel({
  code,
  bytes,
  onRetry,
}: {
  code: DemoErrorCode
  bytes?: number | null
  onRetry: () => void
}) {
  const action = ERROR_ACTION[code]
  const message = code === 'too_large' && bytes != null ? tooLargeCopy(bytes) : ERROR_COPY[code]
  return (
    <div
      role="alert"
      className="flex w-full flex-col items-center gap-4 rounded-lg border border-error/40 bg-bg-secondary p-8 text-center"
    >
      <svg
        className="size-6 text-error"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-fg">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={onRetry}>
          Try another file
        </Button>
        {action ? (
          <a
            className={`text-sm ${linkClass}`}
            href={action.href}
            target="_blank"
            rel="noreferrer"
          >
            {action.label}
          </a>
        ) : null}
      </div>
    </div>
  )
}
