// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { codeToHtml } from 'shiki'

// Server component: Shiki highlights at build time, so the page ships zero highlighter
// JS (DESIGN code-block rule). `vesper` is the dark theme that does not fight the
// burnt-orange accent.
export async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const html = await codeToHtml(code, { lang, theme: 'vesper' })
  return (
    <div
      className="overflow-x-auto rounded-md border border-border bg-bg-secondary p-4 text-sm [&_pre]:bg-transparent [&_pre]:font-mono"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
