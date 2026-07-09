import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  comparisonMetadata,
  itemMetadata,
  kindHubMetadata
} from '@/lib/comparisonMetadata'
import { SITE_NAME } from '@/lib/site'
import type {
  ComparisonStat,
  Item,
  Kind,
  SpecDefinition
} from '@/types/catalogue'

const gpuKind: Kind = {
  id: '1',
  slug: 'gpu',
  name: 'GPU',
  namePlural: 'GPUs',
  description: 'Compare graphics cards side by side.'
}

const vramSpec: SpecDefinition = {
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
}

const msrpSpec: SpecDefinition = {
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

const rtx3080: Item = {
  id: '1',
  kindSlug: 'gpu',
  slug: 'rtx-3080',
  name: 'RTX 3080',
  brand: 'NVIDIA',
  imageUrl: 'https://example.com/3080.png',
  releaseDate: '2020-09-17',
  viewCount: 0,
  specs: { vram_gb: 10, msrp_usd: 699 }
}

const rtx3070: Item = {
  id: '2',
  kindSlug: 'gpu',
  slug: 'rtx-3070',
  name: 'RTX 3070',
  brand: 'NVIDIA',
  imageUrl: null,
  releaseDate: '2020-10-29',
  viewCount: 0,
  specs: { vram_gb: 8, msrp_usd: 499 }
}

const featuredStat: ComparisonStat = {
  pairKey: 'gpu:rtx-3070|rtx-3080',
  kindSlug: 'gpu',
  itemSlugs: ['rtx-3070', 'rtx-3080'],
  viewCount: 0,
  isFeatured: true,
  createdAt: '2026-01-01T00:00:00.000Z'
}

describe('comparisonMetadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses verdict summary and featured indexing for canonical pairs', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://compare.example.com')

    const metadata = comparisonMetadata({
      kind: gpuKind,
      items: [rtx3070, rtx3080],
      slugs: ['rtx-3070', 'rtx-3080'],
      specs: [vramSpec, msrpSpec],
      stat: featuredStat
    })

    expect(metadata.title).toBe('RTX 3070 vs RTX 3080')
    expect(metadata.description).toContain('RTX 3080')
    expect(metadata.robots).toEqual({ index: true, follow: true })
    expect(metadata.openGraph?.title).toBe(
      `RTX 3070 vs RTX 3080 | ${SITE_NAME}`
    )
    const images = metadata.openGraph?.images
    const firstImage = Array.isArray(images) ? images[0] : images
    expect(firstImage).toMatchObject({
      url: 'https://compare.example.com/compare/gpu/rtx-3070-vs-rtx-3080/opengraph-image',
      width: 1200,
      height: 630
    })
  })

  it('noindexes non-canonical slug order and 3+ way comparisons', () => {
    const threeWay = comparisonMetadata({
      kind: gpuKind,
      items: [
        rtx3070,
        rtx3080,
        { ...rtx3070, slug: 'rtx-3060', name: 'RTX 3060' }
      ],
      slugs: ['rtx-3070', 'rtx-3080', 'rtx-3060'],
      specs: [vramSpec, msrpSpec]
    })

    expect(threeWay.robots).toEqual({ index: false, follow: true })

    const reversed = comparisonMetadata({
      kind: gpuKind,
      items: [rtx3080, rtx3070],
      slugs: ['rtx-3080', 'rtx-3070'],
      specs: [vramSpec, msrpSpec]
    })

    expect(reversed.robots).toEqual({ index: false, follow: true })
  })
})

describe('itemMetadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('describes filled specs and uses large-image cards when an image exists', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://compare.example.com')

    const metadata = itemMetadata(gpuKind, rtx3080, [vramSpec, msrpSpec])

    expect(metadata.title).toBe('RTX 3080 specs')
    expect(metadata.description).toContain('2 specs')
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' })
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://example.com/3080.png' }
    ])
  })
})

describe('kindHubMetadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses kind copy for hub pages', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://compare.example.com')

    const metadata = kindHubMetadata(gpuKind)

    expect(metadata.title).toBe('Compare GPUs')
    expect(metadata.description).toBe(gpuKind.description)
    expect(metadata.alternates?.canonical).toBe('/compare/gpu')
    expect(metadata.openGraph?.title).toBe(`Compare GPUs | ${SITE_NAME}`)
  })
})
