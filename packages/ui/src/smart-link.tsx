// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import Link from 'next/link'
import type { ComponentProps } from 'react'

import { isInternalHref } from './lib/internal-href'

// An unstyled link (caller owns className) that client-navigates in-app routes via next/link and
// full-loads external / cross-app hrefs via <a>. Use for custom-styled links that are not the
// ButtonLink or Anchor skins. `reload` forces <a> for a relative path that leaves this Next app.
export function SmartLink({
  href,
  reload,
  ...props
}: ComponentProps<'a'> & { reload?: boolean }) {
  if (isInternalHref(href, reload)) {
    return <Link href={href} {...props} />
  }
  return <a href={href} {...props} />
}
