// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { linkClass } from '@bankstract/ui'

import type { ParseProgress } from '../lib/parse-client'
import type { DemoState } from '../lib/state'

import { Dropzone } from './Dropzone'
import { SupportedBanks } from './SupportedBanks'

// Engine stage strings -> human labels (bankstract ProgressEvent stages).
const STAGE_LABELS: Record<string, string> = {
  detect: 'Detecting bank',
  open: 'Opening document',
  extract_page: 'Reading pages',
  walk_page: 'Parsing rows',
  reconcile: 'Reconciling totals',
  done: 'Finishing',
}

interface IdleViewProps {
  status: DemoState['status']
  activeFile: File | null
  progress: ParseProgress | null
  onFile: (file: File) => void
  onDragEnter: () => void
  onDragLeave: () => void
  onSample: () => void
}

export function IdleView({
  status,
  activeFile,
  progress,
  onFile,
  onDragEnter,
  onDragLeave,
  onSample,
}: IdleViewProps) {
  const pct =
    progress && progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        status={status}
        activeFile={activeFile}
        onFile={onFile}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      />
      {status === 'parsing' && progress ? (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div className="flex justify-between text-xs text-fg-tertiary">
            <span>{STAGE_LABELS[progress.stage] ?? 'Working'}</span>
            <span className="font-mono">
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-fg-tertiary">
          Don&apos;t have one handy?{' '}
          <button
            type="button"
            disabled={status === 'parsing'}
            onClick={onSample}
            className={`${linkClass} disabled:opacity-50`}
          >
            Try a sample
          </button>
        </p>
        <SupportedBanks />
      </div>
    </div>
  )
}
