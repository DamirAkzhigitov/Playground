import { cache } from 'react'

import {
  getItemsByKind,
  listComparisonStats,
  listKinds
} from '@/data/comparisons'
import {
  selectCataloguePage,
  type CataloguePageResult
} from '@/data/catalogueQuery'
import { comparisonPath } from '@/lib/comparison'
import type {
  CatalogueCardSize,
  CatalogueEntry,
  CatalogueSort,
  Item
} from '@/types/catalogue'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Stable card size derived from the pair key so layout is sort-independent. */
function deriveSize(pairKey: string, isFeatured: boolean): CatalogueCardSize {
  if (isFeatured) return 'featured'
  const variants: CatalogueCardSize[] = [
    'default',
    'default',
    'wide',
    'default',
    'tall'
  ]
  return variants[hashString(pairKey) % variants.length]
}

/**
 * Build catalogue cards from comparison_stats (pointers) joined with item data.
 * Titles like "RTX 5080 vs RTX 3070" are derived here, never stored.
 * Wrapped in React cache() to dedupe D1 reads within a request.
 */
export const getCatalogueEntries = cache(
  async (): Promise<CatalogueEntry[]> => {
    const [stats, kinds] = await Promise.all([
      listComparisonStats({ limit: 200 }),
      listKinds()
    ])

    const kindBySlug = new Map(kinds.map((kind) => [kind.slug, kind]))
    const kindSlugs = Array.from(new Set(stats.map((stat) => stat.kindSlug)))

    const itemMaps = await Promise.all(
      kindSlugs.map(async (kindSlug) => {
        const items = await getItemsByKind(kindSlug)
        return [
          kindSlug,
          new Map(items.map((item) => [item.slug, item]))
        ] as const
      })
    )
    const itemsByKind = new Map<string, Map<string, Item>>(itemMaps)

    const entries: CatalogueEntry[] = []

    for (const stat of stats) {
      const kind = kindBySlug.get(stat.kindSlug)
      const itemMap = itemsByKind.get(stat.kindSlug)
      if (!kind || !itemMap) continue

      const items = stat.itemSlugs
        .map((slug) => itemMap.get(slug))
        .filter((item): item is Item => item !== undefined)

      if (items.length < 2) continue

      const title = items.map((item) => item.name).join(' vs ')

      entries.push({
        id: stat.pairKey,
        title,
        description: `Compare ${title} on ${kind.name.toLowerCase()} specs, features, and price.`,
        badge: kind.name,
        imageUrl: items[0].imageUrl ?? '',
        size: deriveSize(stat.pairKey, stat.isFeatured),
        publishedAt: new Date(
          stat.createdAt.replace(' ', 'T') + 'Z'
        ).toISOString(),
        viewCount: stat.viewCount,
        href: comparisonPath(stat.kindSlug, stat.itemSlugs)
      })
    }

    return entries
  }
)

export async function getCataloguePage(
  page: number,
  query: string,
  sort: CatalogueSort = 'new'
): Promise<CataloguePageResult> {
  const entries = await getCatalogueEntries()
  return selectCataloguePage(entries, page, query, sort)
}
