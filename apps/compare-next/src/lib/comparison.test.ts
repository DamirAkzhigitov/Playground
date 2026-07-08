import { describe, expect, it } from 'vitest'

import {
  isPairSegment,
  isValidItemSlug,
  itemPath,
  PAIR_SEPARATOR
} from '@/lib/comparison'

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
