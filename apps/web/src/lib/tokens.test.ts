// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { ACCENTS, INK, PAPER, resolveAccentTheme } from '@bankstract/ui'
import { describe, expect, it } from 'vitest'

import { EMAIL_FAINT, EMAIL_INK, EMAIL_MUTED } from './email/layout'

const root = resolve(__dirname, '../../../..')
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8')

// The body of the first rule whose selector line contains `selector`.
function block(css: string, selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`selector not found: ${selector}`)
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
}

function decl(body: string, name: string): string {
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(body)
  if (!match?.[1]) throw new Error(`declaration not found: ${name}`)
  return match[1].trim().toLowerCase()
}

describe('theme.css matches the token data', () => {
  const css = read('packages/ui/src/theme.css')

  it('paper surface', () => {
    const paper = block(css, '.surface-paper {')
    expect(decl(paper, '--color-bg')).toBe(PAPER.bg)
    expect(decl(paper, '--color-bg-secondary')).toBe(PAPER.bgSecondary)
    expect(decl(paper, '--color-bg-tertiary')).toBe(PAPER.bgTertiary)
    expect(decl(paper, '--color-fg')).toBe(PAPER.fg)
    expect(decl(paper, '--color-fg-secondary')).toBe(PAPER.fgSecondary)
    expect(decl(paper, '--color-fg-tertiary')).toBe(PAPER.fgTertiary)
    expect(decl(paper, '--color-border')).toBe(PAPER.border)
  })

  it('ink surface', () => {
    const ink = block(css, '.surface-ink {')
    expect(decl(ink, '--color-bg')).toBe(INK.bg)
    expect(decl(ink, '--color-fg')).toBe(INK.fg)
    expect(decl(ink, '--color-fg-secondary')).toBe(INK.fgSecondary)
    expect(decl(ink, '--color-border')).toBe(INK.border)
  })

  it.each(Object.keys(ACCENTS) as (keyof typeof ACCENTS)[])('accent theme %s', (name) => {
    const theme = block(css, `:root[data-theme='${name}']`)
    const t = ACCENTS[name]
    expect(decl(theme, '--accent')).toBe(t.accent)
    expect(decl(theme, '--accent-strong')).toBe(t.strong)
    expect(decl(theme, '--accent-on-ink')).toBe(t.onInk)
    expect(decl(theme, '--accent-fg')).toBe(t.fg)
    t.tints.forEach((tint, i) => expect(decl(theme, `--tint-${i + 1}`)).toBe(tint))
  })
})

describe('copies that cannot read theme.css', () => {
  it('email shell', () => {
    expect(EMAIL_INK).toBe(PAPER.fg)
    expect(EMAIL_MUTED).toBe(PAPER.fgSecondary)
    expect(EMAIL_FAINT).toBe(PAPER.fgTertiary)
  })

  it('docs theme (light is paper, dark is ink)', () => {
    const css = read('apps/docs/app/globals.css')
    const light = block(css, ':root {')
    expect(decl(light, '--color-fd-background')).toBe(PAPER.bg)
    expect(decl(light, '--color-fd-foreground')).toBe(PAPER.fg)
    expect(decl(light, '--color-fd-muted-foreground')).toBe(PAPER.fgSecondary)
    expect(decl(light, '--color-fd-border')).toBe(PAPER.border)
    expect(decl(light, '--color-fd-primary')).toBe(ACCENTS.orange.strong)
    const dark = block(css, '.dark {')
    expect(decl(dark, '--color-fd-background')).toBe(INK.bg)
    expect(decl(dark, '--color-fd-foreground')).toBe(INK.fg)
    expect(decl(dark, '--color-fd-border')).toBe(INK.border)
    expect(decl(dark, '--color-fd-primary')).toBe(ACCENTS.orange.accent)
  })

  it('OG card', () => {
    const og = read('packages/seo/src/og.tsx')
    const lit = (name: string): string => {
      const m = new RegExp(`const ${name} = '(#[0-9a-fA-F]{6})'`).exec(og)
      if (!m?.[1]) throw new Error(`${name} not found`)
      return m[1].toLowerCase()
    }
    expect(lit('BG')).toBe(PAPER.bg)
    expect(lit('FG')).toBe(PAPER.fg)
    expect(lit('MUTED')).toBe(PAPER.fgSecondary)
    expect(lit('ACCENT')).toBe(ACCENTS.orange.strong)
    const tints = /const TINTS = \[([^\]]+)\]/.exec(og)?.[1]?.match(/#[0-9a-fA-F]{6}/g)
    expect(tints).toEqual([...ACCENTS.orange.tints])
  })
})

describe('resolveAccentTheme', () => {
  it('accepts a known theme', () => {
    expect(resolveAccentTheme('red')).toBe('red')
  })

  it.each([undefined, '', 'blue', 'constructor', 'toString', '__proto__'])(
    'falls back to orange for %s',
    (value) => {
      expect(resolveAccentTheme(value)).toBe('orange')
    },
  )
})
