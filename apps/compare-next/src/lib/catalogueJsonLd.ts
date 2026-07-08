import type { CataloguePageResult } from '@/data/fetchCatalogue'
import {
  catalogueCopyKey,
  CATALOGUE_SUBTITLE,
  CATALOGUE_TITLE
} from '@/lib/catalogueCopy'
import type { CatalogueSort } from '@/types/catalogue'

export function catalogueJsonLd(
  page: CataloguePageResult,
  sort: CatalogueSort,
  isHome = false
) {
  const key = catalogueCopyKey(sort, isHome)

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: CATALOGUE_TITLE[key],
    description: CATALOGUE_SUBTITLE[key],
    numberOfItems: page.total,
    itemListElement: page.items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Thing',
        name: entry.title,
        description: entry.description
      }
    }))
  }
}
