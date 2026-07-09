import { describe, expect, it } from 'vitest'

import { catalogueSlotClass } from '@/lib/catalogueSlot'

describe('catalogueSlotClass', () => {
  it('returns the base slot class for the default size', () => {
    expect(catalogueSlotClass('default')).toBe('catalogue__slot')
  })

  it('adds a size modifier for non-default cards', () => {
    expect(catalogueSlotClass('wide')).toBe(
      'catalogue__slot catalogue__slot--wide'
    )
    expect(catalogueSlotClass('featured')).toBe(
      'catalogue__slot catalogue__slot--featured'
    )
  })
})
