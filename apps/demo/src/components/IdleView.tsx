// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { DemoState } from '../lib/state'
import { LINK_CLASS } from '../lib/styles'

import { Dropzone } from './Dropzone'
import { SupportedBanks } from './SupportedBanks'

interface IdleViewProps {
  status: DemoState['status']
  activeFile: File | null
  onFile: (file: File) => void
  onDragEnter: () => void
  onDragLeave: () => void
  onSample: () => void
}

export function IdleView({
  status,
  activeFile,
  onFile,
  onDragEnter,
  onDragLeave,
  onSample,
}: IdleViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        status={status}
        activeFile={activeFile}
        onFile={onFile}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      />
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-fg-tertiary">
          Don&apos;t have one handy?{' '}
          <button
            type="button"
            disabled={status === 'parsing'}
            onClick={onSample}
            className={`${LINK_CLASS} disabled:opacity-50`}
          >
            Try a sample
          </button>
        </p>
        <SupportedBanks />
      </div>
    </div>
  )
}
