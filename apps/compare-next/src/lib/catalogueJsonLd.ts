import { EN } from '@/i18n/messages'
import type { CataloguePageResult } from '@/data/fetchCatalogue'
import type { CatalogueSort } from '@/types/catalogue'

const LIST_NAME: Record<CatalogueSort | 'home', string> = {
  home: EN['catalogue.title'],
  new: EN['catalogue.titleNew'],
  hot: EN['catalogue.titleHot'],
  popular: EN['catalogue.titlePopular']
}

const LIST_DESCRIPTION: Record<CatalogueSort | 'home', string> = {
  home: EN['catalogue.subtitle'],
  new: EN['catalogue.subtitleNew'],
  hot: EN['catalogue.subtitleHot'],
  popular: EN['catalogue.subtitlePopular']
}

export function catalogueJsonLd(
  page: CataloguePageResult,
  sort: CatalogueSort,
  isHome = false
) {
  const key = isHome ? 'home' : sort

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: LIST_NAME[key],
    description: LIST_DESCRIPTION[key],
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
