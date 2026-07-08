import { describe, expect, it } from 'vitest'

import {
  filterEntries,
  PAGE_SIZE,
  selectCataloguePage,
  sortEntries
} from '@/data/catalogueQuery'
import { catalogueSortPath } from '@/lib/catalogueRoutes'
import type { CatalogueEntry } from '@/types/catalogue'

function entry(
  id: string,
  overrides: Partial<CatalogueEntry> = {}
): CatalogueEntry {
  return {
    id,
    title: `Item ${id}`,
    description: `Compare item ${id}`,
    badge: 'GPU',
    imageUrl: '',
    size: 'default',
    publishedAt: '2026-01-01T00:00:00.000Z',
    viewCount: 10,
    href: `/compare/gpu/${id}`,
    ...overrides
  }
}

const FIXTURE: CatalogueEntry[] = [
  entry('a', {
    title: 'RTX 5080 vs RTX 3070',
    publishedAt: '2026-03-01T00:00:00.000Z',
    viewCount: 100
  }),
  entry('b', {
    title: 'RX 7900 XTX vs RX 7800 XT',
    publishedAt: '2026-02-01T00:00:00.000Z',
    viewCount: 50
  }),
  entry('c', {
    title: 'RTX 4090 vs RTX 5080',
    publishedAt: '2026-01-15T00:00:00.000Z',
    viewCount: 200
  })
]

describe('selectCataloguePage', () => {
  it('returns the first page and a next page when more entries exist', () => {
    const many = Array.from({ length: PAGE_SIZE + 2 }, (_, index) =>
      entry(`p-${index}`)
    )
    const page = selectCataloguePage(many, 0, '', 'new')

    expect(page.items).toHaveLength(PAGE_SIZE)
    expect(page.total).toBe(many.length)
    expect(page.nextPage).toBe(1)
  })

  it('filters entries by search query', () => {
    const page = selectCataloguePage(FIXTURE, 0, 'RTX', 'new')

    expect(page.total).toBe(2)
    expect(
      page.items.every((item) => item.title.toLowerCase().includes('rtx'))
    ).toBe(true)
  })
})

describe('sortEntries', () => {
  it('sorts by newest publishedAt for the new sort', () => {
    const sorted = sortEntries(FIXTURE, 'new')
    expect(sorted.map((item) => item.id)).toEqual(['a', 'b', 'c'])
  })

  it('sorts by view count for the popular sort', () => {
    const sorted = sortEntries(FIXTURE, 'popular')
    expect(sorted.map((item) => item.id)).toEqual(['c', 'a', 'b'])
  })
})

describe('filterEntries', () => {
  it('returns all entries when the query is blank', () => {
    expect(filterEntries(FIXTURE, '   ')).toHaveLength(FIXTURE.length)
  })
})

describe('catalogueSortPath', () => {
  it('maps sort keys to route paths', () => {
    expect(catalogueSortPath('hot')).toBe('/hot')
    expect(catalogueSortPath('popular')).toBe('/popular')
  })
})
