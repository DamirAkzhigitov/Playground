import { describe, expect, it } from 'vitest'

import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import type { Item, SpecDefinition } from '@/types/catalogue'

const specs: SpecDefinition[] = [
  {
    key: 'vram_gb',
    label: 'VRAM',
    unit: 'GB',
    valueType: 'number',
    higherIsBetter: true,
    group: 'Memory',
    sortOrder: 1
  },
  {
    key: 'msrp_usd',
    label: 'MSRP',
    unit: '$',
    valueType: 'number',
    higherIsBetter: false,
    group: 'Price',
    sortOrder: 2
  }
]

const rtx5080: Item = {
  id: '1',
  kindSlug: 'gpu',
  slug: 'rtx-5080',
  name: 'RTX 5080',
  brand: 'NVIDIA',
  imageUrl: null,
  releaseDate: null,
  viewCount: 0,
  specs: { vram_gb: 16, msrp_usd: 999 }
}

const rtx3070: Item = {
  id: '2',
  kindSlug: 'gpu',
  slug: 'rtx-3070',
  name: 'RTX 3070',
  brand: 'NVIDIA',
  imageUrl: null,
  releaseDate: null,
  viewCount: 0,
  specs: { vram_gb: 8, msrp_usd: 499 }
}

describe('buildComparisonVerdict', () => {
  it('builds a summary and per-item pros', () => {
    const verdict = buildComparisonVerdict([rtx5080, rtx3070], specs)

    expect(verdict).not.toBeNull()
    expect(verdict!.summary).toContain('RTX 5080')
    expect(
      verdict!.items.find((entry) => entry.slug === 'rtx-5080')?.winCount
    ).toBe(1)
    expect(verdict!.faq.length).toBeGreaterThan(0)
  })
})
