import type { Metadata } from 'next'

import { EN } from '@/i18n/messages'
import { catalogueSortPath } from '@/lib/catalogueRoutes'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import type { CatalogueSort } from '@/types/catalogue'

const META_TITLE: Record<CatalogueSort | 'home', string> = {
  home: `${EN['catalogue.title']} | ${SITE_NAME}`,
  new: `${EN['catalogue.titleNew']} | ${SITE_NAME}`,
  hot: `${EN['catalogue.titleHot']} | ${SITE_NAME}`,
  popular: `${EN['catalogue.titlePopular']} | ${SITE_NAME}`
}

const META_DESCRIPTION: Record<CatalogueSort | 'home', string> = {
  home: EN['catalogue.subtitle'],
  new: EN['catalogue.subtitleNew'],
  hot: EN['catalogue.subtitleHot'],
  popular: EN['catalogue.subtitlePopular']
}

type CatalogueMetadataOptions = {
  sort: CatalogueSort
  isHome?: boolean
}

export function catalogueMetadata({
  sort,
  isHome = false
}: CatalogueMetadataOptions): Metadata {
  const key = isHome ? 'home' : sort
  const canonicalPath = isHome ? '/' : catalogueSortPath(sort)

  return {
    title: META_TITLE[key],
    description: META_DESCRIPTION[key],
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: SITE_NAME,
      url: `${getSiteUrl()}${canonicalPath}`,
      title: META_TITLE[key],
      description: META_DESCRIPTION[key]
    },
    twitter: {
      card: 'summary',
      title: META_TITLE[key],
      description: META_DESCRIPTION[key]
    }
  }
}
