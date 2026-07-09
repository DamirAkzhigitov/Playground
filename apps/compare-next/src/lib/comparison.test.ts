import { describe, expect, it } from 'vitest'

import {
  buildPairKey,
  buildPairSegment,
  canonicalComparisonPath,
  canonicalOrder,
  computeWinners,
  comparisonBreadcrumbLabel,
  comparisonPageHeading,
  comparisonTitleFromNames,
  formatSpecValue,
  isCanonicalOrder,
  isPairSegment,
  isValidItemSlug,
  itemPath,
  parsePairSegment,
  PAIR_SEPARATOR
} from '@/lib/comparison'
import type { Item, SpecDefinition } from '@/types/catalogue'

const memoryType: SpecDefinition = {
  key: 'memory_type',
  label: 'Memory Type',
  unit: null,
  valueType: 'text',
  higherIsBetter: null,
  comparisonMode: 'ordinal',
  comparisonRole: 'informational',
  comparisonWeight: 0,
  minimumDifferencePercent: 0,
  group: null,
  sortOrder: 0,
  options: [
    { key: 'gddr6', label: 'GDDR6', rank: 1, sortOrder: 10 },
    { key: 'gddr7', label: 'GDDR7', rank: 2, sortOrder: 20 }
  ]
}

function item(slug: string, memoryTypeValue: string): Item {
  return {
    id: slug,
    kindSlug: 'gpu',
    slug,
    name: slug,
    brand: null,
    imageUrl: null,
    releaseDate: null,
    viewCount: 0,
    specs: { memory_type: memoryTypeValue }
  }
}

describe('comparison routing helpers', () => {
  it('detects pair segments by the reserved separator', () => {
    expect(isPairSegment(`rtx-5080${PAIR_SEPARATOR}rtx-3070`)).toBe(true)
    expect(isPairSegment('rtx-5080')).toBe(false)
  })

  it('rejects item slugs that contain the pair separator', () => {
    expect(isValidItemSlug('rtx-5080')).toBe(true)
    expect(isValidItemSlug(`foo${PAIR_SEPARATOR}bar`)).toBe(false)
  })

  it('builds item paths', () => {
    expect(itemPath('gpu', 'rtx-5080')).toBe('/compare/gpu/rtx-5080')
  })

  it('parses, builds, and canonicalizes pair segments', () => {
    expect(parsePairSegment(`rtx-5080${PAIR_SEPARATOR}rtx-3070`)).toEqual([
      'rtx-5080',
      'rtx-3070'
    ])
    expect(parsePairSegment(`a${PAIR_SEPARATOR}a${PAIR_SEPARATOR}b`)).toEqual([
      'a',
      'b'
    ])
    expect(buildPairSegment(['rtx-5080', 'rtx-3070'])).toBe(
      `rtx-5080${PAIR_SEPARATOR}rtx-3070`
    )
    expect(canonicalOrder(['rtx-5080', 'rtx-3070'])).toEqual([
      'rtx-3070',
      'rtx-5080'
    ])
    expect(buildPairKey('gpu', ['rtx-5080', 'rtx-3070'])).toBe(
      'gpu:rtx-3070|rtx-5080'
    )
    expect(canonicalComparisonPath('gpu', ['rtx-5080', 'rtx-3070'])).toBe(
      `/compare/gpu/rtx-3070${PAIR_SEPARATOR}rtx-5080`
    )
    expect(isCanonicalOrder(['rtx-3070', 'rtx-5080'])).toBe(true)
    expect(isCanonicalOrder(['rtx-5080', 'rtx-3070'])).toBe(false)
  })
})

describe('comparison display titles', () => {
  const eightGpus = [
    'GeForce RTX 3070',
    'GeForce RTX 3080',
    'GeForce RTX 4060 Ti',
    'GeForce RTX 4080 Super',
    'GeForce RTX 4090',
    'GeForce RTX 5080',
    'Radeon RX 7700 XT',
    'Radeon RX 7900 XTX'
  ]

  it('keeps the full vs chain for two- and three-way comparisons', () => {
    expect(comparisonTitleFromNames(['A', 'B'])).toBe('A vs B')
    expect(comparisonPageHeading(['A', 'B'])).toBe('A vs B')
    expect(comparisonBreadcrumbLabel(['A', 'B'])).toBe('A vs B')

    expect(comparisonPageHeading(['A', 'B', 'C'])).toBe('A vs B vs C')
    expect(comparisonBreadcrumbLabel(['A', 'B', 'C'])).toBe('A vs B vs C')
  })

  it('collapses long headings and breadcrumbs without dropping metadata title', () => {
    expect(comparisonPageHeading(eightGpus)).toBe(
      'GeForce RTX 3070 vs GeForce RTX 3080 & 6 more'
    )
    expect(comparisonBreadcrumbLabel(eightGpus)).toBe('8-item comparison')
    expect(comparisonTitleFromNames(eightGpus)).toBe(eightGpus.join(' vs '))
  })
})

describe('ordinal spec helpers', () => {
  it('highlights the highest ranked option and resolves its label', () => {
    expect(
      computeWinners(
        [item('rtx-3070', 'gddr6'), item('rtx-5080', 'gddr7')],
        memoryType
      )
    ).toEqual(new Set(['rtx-5080']))
    expect(formatSpecValue('gddr7', memoryType)).toBe('GDDR7')
  })

  it('formats boolean, numeric, and empty values', () => {
    const booleanSpec: SpecDefinition = {
      ...memoryType,
      key: 'ray_tracing',
      label: 'Ray Tracing',
      valueType: 'boolean',
      comparisonMode: 'none',
      options: []
    }
    const numericSpec: SpecDefinition = {
      ...memoryType,
      key: 'msrp_usd',
      label: 'MSRP',
      valueType: 'number',
      comparisonMode: 'numeric',
      unit: '$',
      options: []
    }

    expect(formatSpecValue(true, booleanSpec)).toBe('Yes')
    expect(formatSpecValue(false, booleanSpec)).toBe('No')
    expect(formatSpecValue(null, booleanSpec)).toBe('—')
    expect(formatSpecValue(1299, numericSpec)).toBe('$1,299')
    expect(formatSpecValue('plain', memoryType)).toBe('plain')
  })

  it('does not highlight tied or unknown ordinal values', () => {
    expect(
      computeWinners(
        [item('rtx-3070', 'gddr6'), item('rx-7700-xt', 'gddr6')],
        memoryType
      )
    ).toEqual(new Set())
    expect(
      computeWinners(
        [item('rtx-3070', 'gddr6'), item('unknown', 'unknown')],
        memoryType
      )
    ).toEqual(new Set())
    expect(formatSpecValue('unknown', memoryType)).toBe('unknown')
  })
})
