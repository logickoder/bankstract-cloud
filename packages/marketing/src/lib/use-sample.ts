// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

'use client'

import { useSyncExternalStore } from 'react'

import { DEFAULT_SAMPLE, type SampleParse, generateSample } from './hero-sample'

// A tiny shared store. The server and the hydrating client both read DEFAULT_SAMPLE, so there is
// no mismatch and the page stays statically prerendered. After hydration the first client read
// rolls one random sample; every consumer (stat, tiles, feature rows) shows the same statement
// until `rerollSample` swaps it for everyone at once.
let current: SampleParse | undefined
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getClientSnapshot = () => (current ??= generateSample(Math.random))
const getServerSnapshot = () => DEFAULT_SAMPLE

export function useSample(): SampleParse {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}

export function rerollSample(): void {
  current = generateSample(Math.random)
  for (const listener of listeners) listener()
}
