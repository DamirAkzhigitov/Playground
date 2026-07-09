import { describe, expect, it } from 'vitest'

import {
  computeWinners,
  formatSpecValue,
  isPairSegment,
  isValidItemSlug,
  itemPath,
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
