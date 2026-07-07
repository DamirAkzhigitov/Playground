import { EN } from '@/i18n/messages'
import type { CataloguePageResult } from '@/data/fetchCatalogue'

export function catalogueJsonLd(page: CataloguePageResult) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: EN['catalogue.title'],
    description: EN['catalogue.subtitle'],
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
