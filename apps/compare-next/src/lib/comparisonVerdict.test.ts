import { describe, expect, it } from 'vitest'

import { computeWinners } from '@/lib/comparison'
import { buildComparisonVerdict } from '@/lib/comparisonVerdict'
import type { Item, SpecDefinition } from '@/types/catalogue'

function spec(overrides: Partial<SpecDefinition>): SpecDefinition {
  return {
    key: 'performance',
    label: 'Performance',
    unit: null,
    valueType: 'number',
    higherIsBetter: true,
    comparisonRole: 'primary',
    comparisonWeight: 1,
    minimumDifferencePercent: 0,
    group: null,
    sortOrder: 0,
    ...overrides
  }
}

const rtx3080: Item = {
  id: '1',
  kindSlug: 'gpu',
  slug: 'rtx-3080',
  name: 'RTX 3080',
  brand: 'NVIDIA',
  imageUrl: null,
  releaseDate: null,
  viewCount: 0,
  specs: {
    vram_gb: 10,
    memory_bus_bit: 320,
    shader_cores: 8704,
    boost_clock_mhz: 1710,
    tdp_w: 320,
    length_mm: 285,
    msrp_usd: 699
  }
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
  specs: {
    vram_gb: 8,
    memory_bus_bit: 256,
    shader_cores: 5888,
    boost_clock_mhz: 1725,
    tdp_w: 220,
    length_mm: 242,
    msrp_usd: 499
  }
}

const rtx3060: Item = {
  ...rtx3070,
  id: '3',
  slug: 'rtx-3060',
  name: 'RTX 3060',
  specs: {
    ...rtx3070.specs,
    vram_gb: 8
  }
}

describe('buildComparisonVerdict', () => {
  const gpuSpecs: SpecDefinition[] = [
    spec({
      key: 'vram_gb',
      label: 'VRAM',
      unit: 'GB',
      comparisonWeight: 3,
      minimumDifferencePercent: 5
    }),
    spec({
      key: 'memory_bus_bit',
      label: 'Memory Bus',
      unit: 'bit',
      comparisonWeight: 2,
      minimumDifferencePercent: 5
    }),
    spec({
      key: 'shader_cores',
      label: 'Shader Cores',
      comparisonWeight: 2,
      minimumDifferencePercent: 5
    }),
    spec({
      key: 'boost_clock_mhz',
      label: 'Boost Clock',
      unit: 'MHz',
      comparisonRole: 'informational',
      comparisonWeight: 0
    }),
    spec({
      key: 'tdp_w',
      label: 'TDP',
      unit: 'W',
      higherIsBetter: false,
      comparisonRole: 'tradeoff',
      comparisonWeight: 0
    }),
    spec({
      key: 'length_mm',
      label: 'Length',
      unit: 'mm',
      higherIsBetter: false,
      comparisonRole: 'tradeoff',
      comparisonWeight: 0
    }),
    spec({
      key: 'msrp_usd',
      label: 'MSRP',
      unit: '$',
      higherIsBetter: false,
      comparisonRole: 'tradeoff',
      comparisonWeight: 0
    })
  ]

  it('makes RTX 3080 the primary-spec winner despite RTX 3070 trade-offs', () => {
    const verdict = buildComparisonVerdict([rtx3070, rtx3080], gpuSpecs)

    expect(verdict).not.toBeNull()
    expect(verdict!.summary).toContain('RTX 3080')
    expect(
      verdict!.items.find((entry) => entry.slug === 'rtx-3080')?.score
    ).toBe(7)
    expect(
      verdict!.items.find((entry) => entry.slug === 'rtx-3070')?.score
    ).toBe(0)
    expect(
      verdict!.items.find((entry) => entry.slug === 'rtx-3070')?.tradeoffs
    ).toContain('TDP: 220 W')
    expect(verdict!.faq.length).toBeGreaterThan(0)
  })

  it('does not award primary points for a difference below the threshold', () => {
    const primarySpec = spec({
      key: 'boost_clock_mhz',
      label: 'Performance',
      minimumDifferencePercent: 5
    })

    expect(computeWinners([rtx3080, rtx3070], primarySpec)).toEqual(new Set())
  })

  it('does not mark equal values as winners in a two-item comparison', () => {
    const memoryBus = spec({
      key: 'memory_bus_bit',
      label: 'Memory Bus',
      unit: 'bit'
    })
    const equalBusWidth = {
      ...rtx3070,
      specs: { ...rtx3070.specs, memory_bus_bit: 320 }
    }

    expect(computeWinners([rtx3080, equalBusWidth], memoryBus)).toEqual(
      new Set()
    )
  })

  it('keeps informational winners highlighted without affecting scores', () => {
    const boostClock = spec({
      key: 'boost_clock_mhz',
      label: 'Boost Clock',
      unit: 'MHz',
      comparisonRole: 'informational',
      comparisonWeight: 0,
      minimumDifferencePercent: 5
    })

    expect(computeWinners([rtx3080, rtx3070], boostClock)).toEqual(
      new Set(['rtx-3070'])
    )
  })

  it('keeps a clear leader in multi-item comparisons', () => {
    const vram = spec({
      key: 'vram_gb',
      label: 'VRAM',
      unit: 'GB',
      minimumDifferencePercent: 5
    })
    const nearlyEqual = {
      ...rtx3070,
      id: '4',
      slug: 'rtx-3070-ti',
      name: 'RTX 3070 Ti',
      specs: { ...rtx3070.specs, vram_gb: 15.5 }
    }
    const clearLoser = {
      ...rtx3060,
      specs: { ...rtx3060.specs, vram_gb: 8 }
    }
    const clearLeader = {
      ...rtx3080,
      specs: { ...rtx3080.specs, vram_gb: 16 }
    }

    expect(
      computeWinners([clearLeader, nearlyEqual, clearLoser], vram)
    ).toEqual(new Set(['rtx-3080']))
  })

  it('marks tied leaders when another item has a lower value', () => {
    const memoryBus = spec({
      key: 'memory_bus_bit',
      label: 'Memory Bus',
      unit: 'bit'
    })
    const rtx4060Ti = {
      ...rtx3060,
      id: '5',
      slug: 'rtx-4060-ti',
      name: 'RTX 4060 Ti',
      specs: { ...rtx3060.specs, memory_bus_bit: 128 }
    }
    const matchingBusWidth = {
      ...rtx3080,
      specs: { ...rtx3080.specs, memory_bus_bit: 256 }
    }

    expect(
      computeWinners([rtx3070, rtx4060Ti, matchingBusWidth], memoryBus)
    ).toEqual(new Set(['rtx-3070', 'rtx-3080']))
  })

  it('returns a tied verdict when primary values are missing', () => {
    const noScore = buildComparisonVerdict(
      [
        { ...rtx3080, specs: {} },
        { ...rtx3070, specs: { vram_gb: 8 } }
      ],
      [spec({ key: 'vram_gb', label: 'VRAM', unit: 'GB' })]
    )

    expect(noScore?.summary).toContain('are tied')
    expect(noScore?.items.map((item) => item.score)).toEqual([0, 0])
  })

  it('uses natural punctuation for tied three-item comparisons', () => {
    const verdict = buildComparisonVerdict(
      [
        { ...rtx3080, specs: {} },
        { ...rtx3070, specs: {} },
        { ...rtx3060, specs: {} }
      ],
      [spec({ key: 'vram_gb', label: 'VRAM', unit: 'GB' })]
    )

    expect(verdict?.summary).toContain('RTX 3080, RTX 3070, and RTX 3060')
  })
})
