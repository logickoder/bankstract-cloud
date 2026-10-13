// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import { BrandMark, ButtonLink, cn, SmartLink } from '@bankstract/ui'

import { links } from '../lib/links'

import { MobileMenu } from './MobileMenu'
import { PAGE_CONTAINER } from './Section'

const NAV: readonly { label: string; href: string; reload?: boolean }[] = [
  { label: 'Docs', href: links.docs, reload: true },
  { label: 'Pricing', href: links.pricing },
  { label: 'GitHub', href: links.cloud },
]

// The menu lists every link the bar hides on a phone.
const MENU = [...NAV, { label: 'Sign in', href: links.signin }] as const

const linkClass =
  'flex h-11 items-center rounded-sm px-3 text-sm font-medium text-fg-secondary hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline'

// h-16 (4rem) is subtracted from the hero's min-height, so the first screen fits. Solid paper so it reads over the hero wash. "Get started" is outline, not solid: the page's one
// primary action stays in the content. The three nav links drop below sm; the footer carries them.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border">
      <div className={cn(PAGE_CONTAINER, 'flex h-16 items-center justify-between')}>
        <SmartLink
          href="/"
          className="flex h-11 items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline"
        >
          <BrandMark className="h-3 text-fg" />
          <span className="font-mono text-sm font-medium text-fg">bankstract</span>
        </SmartLink>
        <nav aria-label="Main" className="flex items-center gap-1">
          {NAV.map((item) => (
            <SmartLink
              key={item.label}
              href={item.href}
              reload={item.reload}
              className={cn(linkClass, 'hidden sm:flex')}
            >
              {item.label}
            </SmartLink>
          ))}
          <SmartLink href={links.signin} className={cn(linkClass, 'hidden sm:flex')}>
            Sign in
          </SmartLink>
          <ButtonLink href={links.signup} variant="secondary" className="h-11 py-0">
            Get started
          </ButtonLink>
          <MobileMenu links={MENU} />
        </nav>
      </div>
    </header>
  )
}
