// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { type KeyboardEvent, type ReactNode, useRef } from 'react'

// A keyboard-navigable single-select toggle (WAI-ARIA radiogroup): roving tabindex, arrow keys
// wrap around, only the selected option is in the tab order. Callers own the option list and the
// per-state class (so the segmented-tab look and the primary/secondary-button look both reuse this).
export function SegmentedRadio<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  optionClassName,
  renderOption,
}: {
  options: readonly T[]
  value: T
  onChange: (next: T) => void
  ariaLabel: string
  className?: string
  optionClassName: (selected: boolean) => string
  renderOption?: (option: T, selected: boolean) => ReactNode
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const dir =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!dir) return
    e.preventDefault()
    const cur = options.indexOf(value)
    const next = (cur + dir + options.length) % options.length
    onChange(options[next]!)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={className} onKeyDown={onKeyDown}>
      {options.map((option, i) => {
        const selected = option === value
        return (
          <button
            key={option}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option)}
            className={optionClassName(selected)}
          >
            {renderOption ? renderOption(option, selected) : option}
          </button>
        )
      })}
    </div>
  )
}
