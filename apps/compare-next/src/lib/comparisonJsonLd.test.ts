import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  comparisonJsonLd,
  itemJsonLd,
  kindHubJsonLd
} from '@/lib/comparisonJsonLd'
import type { Item, Kind, SpecDefinition } from '@/types/catalogue'

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

describe('comparisonJsonLd', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns breadcrumb, product blocks, and FAQ structured data', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://compare.example.com')

    const blocks = comparisonJsonLd(
      gpuKind,
      [rtx3070, rtx3080],
      [vramSpec, msrpSpec],
      ['rtx-3070', 'rtx-3080']
    )

    expect(blocks).toHaveLength(4)
    expect(blocks[0]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: 'Home', item: 'https://compare.example.com' },
        {
          position: 2,
          name: 'Compare GPUs',
          item: 'https://compare.example.com/compare/gpu'
        },
        {
          position: 3,
          name: 'RTX 3070 vs RTX 3080',
          item: 'https://compare.example.com/compare/gpu/rtx-3070-vs-rtx-3080'
        }
      ]
    })
    expect(blocks[1]).toMatchObject({
      '@type': 'Product',
      name: 'RTX 3070',
      brand: { '@type': 'Brand', name: 'NVIDIA' }
    })
    expect(blocks[3]).toMatchObject({ '@type': 'FAQPage' })
  })
})

describe('itemJsonLd', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('includes breadcrumb, product offer, and spec properties', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://compare.example.com')

    const blocks = itemJsonLd(gpuKind, rtx3080, [vramSpec, msrpSpec])

    expect(blocks).toHaveLength(2)
    expect(blocks[1]).toMatchObject({
      '@type': 'Product',
      name: 'RTX 3080',
      offers: {
        '@type': 'Offer',
        price: 699,
        priceCurrency: 'USD'
      },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'VRAM', value: '10 GB' },
        { '@type': 'PropertyValue', name: 'MSRP', value: '$699' }
      ]
    })
  })
})

describe('kindHubJsonLd', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('builds an ItemList for a kind hub page', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://compare.example.com')

    const jsonLd = kindHubJsonLd(gpuKind, [rtx3070, rtx3080])

    expect(jsonLd).toMatchObject({
      '@type': 'ItemList',
      name: 'Compare GPUs',
      description: gpuKind.description,
      numberOfItems: 2,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Product',
            name: 'RTX 3070',
            url: 'https://compare.example.com/compare/gpu/rtx-3070'
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Product',
            name: 'RTX 3080',
            url: 'https://compare.example.com/compare/gpu/rtx-3080'
          }
        }
      ]
    })
  })
})
