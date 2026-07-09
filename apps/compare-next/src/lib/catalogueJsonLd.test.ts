import { describe, expect, it } from 'vitest'

import type { CataloguePageResult } from '@/data/catalogueQuery'
import { catalogueJsonLd } from '@/lib/catalogueJsonLd'
import { CATALOGUE_SUBTITLE, CATALOGUE_TITLE } from '@/lib/catalogueCopy'

const page: CataloguePageResult = {
  total: 2,
  nextPage: null,
  items: [
    {
      id: 'a',
      title: 'RTX 5080 vs RTX 3070',
      description: 'Compare flagship GPUs',
      badge: 'GPU',
      imageUrl: '',
      size: 'default',
      publishedAt: '2026-03-01T00:00:00.000Z',
      viewCount: 100,
      href: '/compare/gpu/rtx-5080-vs-rtx-3070'
    },
    {
      id: 'b',
      title: 'RX 7900 XTX vs RX 7800 XT',
      description: 'AMD matchup',
      badge: 'GPU',
      imageUrl: '',
      size: 'wide',
      publishedAt: '2026-02-01T00:00:00.000Z',
      viewCount: 50,
      href: '/compare/gpu/rx-7900-xtx-vs-rx-7800-xt'
    }
  ]
}

describe('catalogueJsonLd', () => {
  it('builds an ItemList with catalogue copy and list positions', () => {
    const jsonLd = catalogueJsonLd(page, 'hot')

    expect(jsonLd['@type']).toBe('ItemList')
    expect(jsonLd.name).toBe(CATALOGUE_TITLE.hot)
    expect(jsonLd.description).toBe(CATALOGUE_SUBTITLE.hot)
    expect(jsonLd.numberOfItems).toBe(2)
    expect(jsonLd.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'RTX 5080 vs RTX 3070',
          description: 'Compare flagship GPUs'
        }
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Thing',
          name: 'RX 7900 XTX vs RX 7800 XT',
          description: 'AMD matchup'
        }
      }
    ])
  })

  it('uses the home copy key on the root route', () => {
    const jsonLd = catalogueJsonLd(page, 'new', true)

    expect(jsonLd.name).toBe(CATALOGUE_TITLE.home)
    expect(jsonLd.description).toBe(CATALOGUE_SUBTITLE.home)
  })
})
