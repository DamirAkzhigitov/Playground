import { describe, expect, it } from 'vitest'

import {
  hasRichItemData,
  pairKeyForSlugs,
  shouldIndexComparison,
  specCoveragePercent
} from '@/lib/comparisonIndexing'
import type { Item, SpecDefinition } from '@/types/catalogue'

const specs: SpecDefinition[] = [
  {
    key: 'vram_gb',
    label: 'VRAM',
    unit: 'GB',
    valueType: 'number',
    higherIsBetter: true,
    comparisonMode: 'numeric',
    comparisonRole: 'primary',
    comparisonWeight: 1,
    minimumDifferencePercent: 0,
    group: null,
    sortOrder: 1,
    options: []
  },
  {
    key: 'msrp_usd',
    label: 'MSRP',
    unit: '$',
    valueType: 'number',
    higherIsBetter: false,
    comparisonMode: 'numeric',
    comparisonRole: 'tradeoff',
    comparisonWeight: 0,
    minimumDifferencePercent: 0,
    group: null,
    sortOrder: 2,
    options: []
  }
]

function item(slug: string, specsData: Item['specs']): Item {
  return {
    id: slug,
    kindSlug: 'gpu',
    slug,
    name: slug,
    brand: null,
    imageUrl: null,
    releaseDate: null,
    viewCount: 0,
    specs: specsData
  }
}

describe('shouldIndexComparison', () => {
  const fullSpecs = { vram_gb: 16, msrp_usd: 999 }
  const a = item('a', fullSpecs)
  const b = item('b', fullSpecs)

  it('indexes featured canonical 2-way pairs', () => {
    expect(
      shouldIndexComparison({
        slugs: ['a', 'b'],
        items: [a, b],
        specs,
        isFeatured: true
      })
    ).toBe(true)
  })

  it('noindexes non-canonical order', () => {
    expect(
      shouldIndexComparison({
        slugs: ['b', 'a'],
        items: [b, a],
        specs,
        isFeatured: true
      })
    ).toBe(false)
  })

  it('noindexes 3-way comparisons', () => {
    const c = item('c', fullSpecs)
    expect(
      shouldIndexComparison({
        slugs: ['a', 'b', 'c'],
        items: [a, b, c],
        specs,
        isFeatured: true
      })
    ).toBe(false)
  })

  it('indexes popular pairs above the threshold', () => {
    expect(
      shouldIndexComparison({
        slugs: ['a', 'b'],
        items: [a, b],
        specs,
        viewCount: 6_000
      })
    ).toBe(true)
  })

  it('noindexes thin pairs without signals', () => {
    const thin = item('thin', { vram_gb: 8 })
    expect(
      shouldIndexComparison({
        slugs: ['a', 'thin'],
        items: [a, thin],
        specs,
        viewCount: 10
      })
    ).toBe(false)
  })
})

describe('specCoveragePercent', () => {
  it('counts filled spec fields', () => {
    const coverage = specCoveragePercent(
      item('a', { vram_gb: 16, msrp_usd: 500 }),
      specs
    )
    expect(coverage).toBe(1)
    expect(
      hasRichItemData(item('a', { vram_gb: 16, msrp_usd: 500 }), specs)
    ).toBe(true)
  })
})

describe('pairKeyForSlugs', () => {
  it('builds a stable pair key from canonical slug order', () => {
    expect(pairKeyForSlugs('gpu', ['rtx-5080', 'rtx-3070'])).toBe(
      'gpu:rtx-3070|rtx-5080'
    )
  })
})
