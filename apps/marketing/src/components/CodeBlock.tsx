// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { codeToHtml } from 'shiki'

import { CopyButton } from './CopyButton'

// Server component: Shiki highlights at build time, so the page ships zero highlighter
// JS (DESIGN code-block rule). `vesper` is the dark theme that does not fight the
// burnt-orange accent. Shiki sets an inline bg on <pre>; `!bg-transparent` overrides it
// so the block reads as the single bg-tertiary surface (DESIGN), not a nested box.
export async function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const html = await codeToHtml(code, { lang, theme: 'vesper' })
  return (
    <div className="group relative min-w-0">
      <CopyButton text={code} />
      <div
        className="overflow-x-auto rounded-md border border-bg-tertiary bg-bg-tertiary p-5 text-sm [&_pre]:m-0 [&_pre]:!bg-transparent [&_pre]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
