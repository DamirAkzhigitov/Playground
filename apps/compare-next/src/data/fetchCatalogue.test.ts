import { describe, expect, it } from 'vitest'

import { getCataloguePage } from '@/data/fetchCatalogue'
import { catalogueSortPath } from '@/lib/catalogueRoutes'

describe('getCataloguePage', () => {
  it('returns the first page of catalogue entries', () => {
    const page = getCataloguePage(0, '', 'new')

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.total).toBeGreaterThan(page.items.length)
    expect(page.nextPage).toBe(1)
  })

  it('filters entries by search query', () => {
    const page = getCataloguePage(0, 'RTX', 'new')

    expect(page.total).toBeGreaterThan(0)
    expect(
      page.items.every((entry) =>
        `${entry.title} ${entry.description} ${entry.badge}`
          .toLowerCase()
          .includes('rtx')
      )
    ).toBe(true)
  })
})

describe('catalogueSortPath', () => {
  it('maps sort keys to route paths', () => {
    expect(catalogueSortPath('hot')).toBe('/hot')
    expect(catalogueSortPath('popular')).toBe('/popular')
  })
})
