// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

import type { OpenAPIPageProps_Preloaded } from 'fumadocs-openapi/ui'
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page'
import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'


import { OpenAPIPage } from '@/components/api-page'
import { getMDXComponents } from '@/components/mdx'
import { openapi } from '@/lib/openapi'
import { source } from '@/lib/source'

interface PageParams {
  params: Promise<{ slug?: string[] }>
}

export default async function Page(props: PageParams) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  const MDX = page.data.body

  // Generated API pages carry `_openapi.preload`. The MDX renders <OpenAPIPage
  // document operations>; preloadOpenAPIPage resolves that document to a bundled
  // schema server-side and we bind it in, so the client component never reads a file.
  const openAPIComponent =
    '_openapi' in page.data
      ? await openapi.preloadOpenAPIPage(page).then((preloaded) => ({
          OpenAPIPage: (componentProps: Omit<OpenAPIPageProps_Preloaded, 'preloaded'>) => (
            <OpenAPIPage {...componentProps} {...preloaded} />
          ),
        }))
      : undefined

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
            ...openAPIComponent,
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()
  return {
    title: page.data.title,
    description: page.data.description,
  }
}
