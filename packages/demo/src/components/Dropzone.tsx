// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { type DragEvent, useRef } from 'react'

import { displayBytes } from '../lib/format'
import type { DemoState } from '../lib/state'

interface DropzoneProps {
  status: DemoState['status']
  activeFile: File | null
  onFile: (file: File) => void
  onDragEnter: () => void
  onDragLeave: () => void
}

const ACCEPT = 'application/pdf,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function Dropzone({ status, activeFile, onFile, onDragEnter, onDragLeave }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isParsing = status === 'parsing'
  const isOver = status === 'dragover'

  function handleDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    onDragLeave()
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <button
      type="button"
      disabled={isParsing}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault()
        onDragEnter()
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault()
        onDragLeave()
      }}
      onDrop={handleDrop}
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center transition-colors duration-150 ${
        isOver ? 'border-accent bg-accent-glow' : 'border-border bg-bg-secondary'
      }`}
    >
      {isParsing ? (
        <>
          <span className="text-fg-secondary">Parsing your statement.</span>
          {activeFile ? (
            <span className="font-mono text-xs text-fg-tertiary">
              {activeFile.name} · {displayBytes(activeFile.size)}
            </span>
          ) : null}
          <span className="text-xs text-fg-tertiary">Usually under 3 seconds.</span>
        </>
      ) : (
        <>
          <span className="text-fg">{isOver ? 'Release to parse' : 'Drag your statement here'}</span>
          <span className="text-sm text-fg-secondary">or click to choose a file</span>
          <span className="text-xs text-fg-tertiary">
            PDF or XLSX · up to 50 MB · processed in memory
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </button>
  )
}
