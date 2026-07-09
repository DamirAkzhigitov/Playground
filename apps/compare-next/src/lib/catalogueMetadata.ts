import type { Metadata } from 'next'

import {
  catalogueCopyKey,
  CATALOGUE_SUBTITLE,
  CATALOGUE_TITLE
} from '@/lib/catalogueCopy'
import { catalogueSortPath } from '@/lib/catalogueRoutes'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import type { CatalogueSort } from '@/types/catalogue'

type CatalogueMetadataOptions = {
  sort: CatalogueSort
  isHome?: boolean
}

function fullTitle(shortTitle: string): string {
  return `${shortTitle} | ${SITE_NAME}`
}

export function catalogueMetadata({
  sort,
  isHome = false
}: CatalogueMetadataOptions): Metadata {
  const key = catalogueCopyKey(sort, isHome)
  const shortTitle = CATALOGUE_TITLE[key]
  const description = CATALOGUE_SUBTITLE[key]
  const canonicalPath = isHome ? '/' : catalogueSortPath(sort)
  const socialTitle = fullTitle(shortTitle)
  const documentTitle = isHome ? socialTitle : shortTitle

  return {
    title: documentTitle,
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      url: `${getSiteUrl()}${canonicalPath}`,
      title: socialTitle,
      description
    },
    twitter: {
      card: 'summary',
      title: socialTitle,
      description
    }
  }
}
