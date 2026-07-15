// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { Section } from './Section'

// Signature element (DESIGN hero-transformation): an accent light-bar sweeps across the
// transform; CSV rows materialize in its wake. Pure CSS (see globals.css) so it ships
// zero JS, clips cleanly, and falls back to a full static render under reduced-motion.
// Synthetic data only (FOO / ACME / 1111 2222).

const PDF_LINES: readonly string[] = [
  'ACME LTD  ****1234',
  '01 Jun  Transfer FOO   +250.00',
  '02 Jun  POS ACME       -40.00',
  '03 Jun  Airtime         -5.00',
]

const CSV_ROWS: readonly (readonly string[])[] = [
  ['2026-06-01', 'Transfer FOO', '250.00', '1,250.00'],
  ['2026-06-02', 'POS ACME', '-40.00', '1,210.00'],
  ['2026-06-03', 'Airtime', '-5.00', '1,205.00'],
]

const CURL = 'curl -X POST /v1/parse -F "pdf=@statement.pdf"'

// Each flyer is the essence of one transaction, carried from the PDF into the table.
const FLYERS: readonly string[] = CSV_ROWS.map((r) => `${r[1]}  ${r[2]}`)

export function TransformationDemo() {
  return (
    <Section>
      {/* Decorative signature animation with synthetic data; the semantic <table> would
          otherwise be announced as a real data table. Hidden from assistive tech. */}
      <div className="relative overflow-hidden rounded-xl" aria-hidden="true">
        <div className="grid items-stretch gap-4 sm:gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-lg border border-border bg-bg-secondary p-5 font-mono text-xs text-fg-tertiary">
            <div className="pb-2 text-fg-secondary">fbn statement</div>
            {PDF_LINES.map((line) => (
              <div key={line} className="truncate py-0.5">
                {line}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <span
              className="flex size-8 rotate-90 items-center justify-center rounded-full border border-border text-accent lg:rotate-0"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </div>

          <div className="self-center overflow-hidden rounded-lg border border-border bg-bg-secondary">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-fg-tertiary">
                <tr>
                  <th className="px-3 py-2 font-normal">date</th>
                  <th className="px-3 py-2 font-normal">narration</th>
                  <th className="px-3 py-2 text-right font-normal">amount</th>
                  <th className="px-3 py-2 text-right font-normal">balance</th>
                </tr>
              </thead>
              <tbody className="text-fg">
                {CSV_ROWS.map((row, i) => (
                  <tr
                    key={row[0]}
                    className="sweep-row border-t border-border"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    {row.map((cell, c) => (
                      <td key={c} className={`px-3 py-2 ${c >= 2 ? 'text-right' : ''}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sweep-bar pointer-events-none absolute inset-y-0 w-px" aria-hidden="true" />

        {/* Transactions in flight from the PDF to the table (desktop layout only). */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
          {FLYERS.map((flyer, i) => (
            <span
              key={flyer}
              className="flyer absolute whitespace-nowrap rounded border border-accent-muted bg-bg-tertiary px-2 py-0.5 font-mono text-[10px] text-accent"
              style={{ top: `${42 + i * 9}%`, animationDelay: `${i * 0.5}s` }}
            >
              {flyer}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-4 py-2.5 font-mono text-xs">
        <span className="text-accent">$</span>
        <span className="text-fg-secondary">{CURL}</span>
        <span className="sweep-caret inline-block h-3.5 w-1.5 bg-accent" aria-hidden="true" />
      </div>
    </Section>
  )
}
