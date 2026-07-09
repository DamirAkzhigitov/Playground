import { cache } from 'react'

import {
  getComparisonStat,
  getItemBySlug,
  getItemsByKind,
  getItemsBySlugs,
  getKindBySlug,
  getSpecDefinitions,
  listComparisonStats
} from '@/data/comparisons'
import {
  buildPairKey,
  comparisonPath,
  assertValidOrdinalSpecs,
  isPairSegment,
  isValidItemSlug,
  parsePairSegment
} from '@/lib/comparison'
import type {
  ComparisonStat,
  Item,
  Kind,
  SpecDefinition
} from '@/types/catalogue'

export type LoadedComparison = {
  kind: Kind
  /** Slugs of the resolved items, in requested order (invalid slugs dropped). */
  slugs: string[]
  items: Item[]
  specs: SpecDefinition[]
  allItems: Item[]
  stat: ComparisonStat | null
}

/**
 * Load everything a comparison page needs. Wrapped in React cache() so
 * generateMetadata and the page render share a single set of D1 reads per
 * request. Returns null when the comparison cannot be built (unknown kind or
 * fewer than two valid items).
 */
export const loadComparison = cache(
  async (
    kindSlug: string,
    pairSegment: string
  ): Promise<LoadedComparison | null> => {
    if (!isPairSegment(pairSegment)) return null

    const requestedSlugs = parsePairSegment(pairSegment)
    if (requestedSlugs.length < 2) return null

    const kind = await getKindBySlug(kindSlug)
    if (!kind) return null

    const [items, specs, allItems] = await Promise.all([
      getItemsBySlugs(kindSlug, requestedSlugs),
      getSpecDefinitions(kindSlug),
      getItemsByKind(kindSlug)
    ])

    if (items.length < 2) return null

    assertValidOrdinalSpecs(items, specs)

    const slugs = items.map((item) => item.slug)
    const pairKey = buildPairKey(kindSlug, slugs)
    const stat = await getComparisonStat(kindSlug, pairKey)

    return {
      kind,
      slugs,
      items,
      specs,
      allItems,
      stat
    }
  }
)

export type LoadedItem = {
  kind: Kind
  item: Item
  specs: SpecDefinition[]
  allItems: Item[]
  related: RelatedComparison[]
}

export const loadItem = cache(
  async (kindSlug: string, itemSlug: string): Promise<LoadedItem | null> => {
    if (!isValidItemSlug(itemSlug) || isPairSegment(itemSlug)) return null

    const kind = await getKindBySlug(kindSlug)
    if (!kind) return null

    const [item, specs, allItems, stats] = await Promise.all([
      getItemBySlug(kindSlug, itemSlug),
      getSpecDefinitions(kindSlug),
      getItemsByKind(kindSlug),
      listComparisonStats({ kindSlug, limit: 48 })
    ])

    if (!item) return null

    assertValidOrdinalSpecs([item], specs)

    const related = buildRelatedComparisons(stats, allItems, item.slug, null)

    return { kind, item, specs, allItems, related }
  }
)

export type PopularComparison = {
  pairKey: string
  href: string
  title: string
  viewCount: number
}

export type LoadedKindHub = {
  kind: Kind
  items: Item[]
  popular: PopularComparison[]
}

/** Load a kind hub: the kind, all its items, and its popular comparisons. */
export const loadKindHub = cache(
  async (kindSlug: string): Promise<LoadedKindHub | null> => {
    const kind = await getKindBySlug(kindSlug)
    if (!kind) return null

    const [items, specs, stats] = await Promise.all([
      getItemsByKind(kindSlug),
      getSpecDefinitions(kindSlug),
      listComparisonStats({ kindSlug, limit: 24 })
    ])

    assertValidOrdinalSpecs(items, specs)

    const itemBySlug = new Map(items.map((item) => [item.slug, item]))

    const popular = stats
      .map((stat) => {
        const names = stat.itemSlugs.map(
          (slug) => itemBySlug.get(slug)?.name ?? slug
        )
        const resolved = stat.itemSlugs.filter((slug) => itemBySlug.has(slug))
        if (resolved.length < 2) return null
        return {
          pairKey: stat.pairKey,
          href: comparisonPath(stat.kindSlug, stat.itemSlugs),
          title: names.join(' vs '),
          viewCount: stat.viewCount
        }
      })
      .filter((entry): entry is PopularComparison => entry !== null)

    return { kind, items, popular }
  }
)

export type RelatedComparison = PopularComparison

function buildRelatedComparisons(
  stats: ComparisonStat[],
  items: Item[],
  includeSlug: string | string[],
  excludePairKey: string | null,
  limit = 8
): RelatedComparison[] {
  const include = new Set(
    Array.isArray(includeSlug) ? includeSlug : [includeSlug]
  )
  const itemBySlug = new Map(items.map((item) => [item.slug, item]))
  const related: RelatedComparison[] = []

  for (const stat of stats) {
    if (stat.pairKey === excludePairKey) continue
    if (!stat.itemSlugs.some((slug) => include.has(slug))) continue

    const names = stat.itemSlugs.map(
      (slug) => itemBySlug.get(slug)?.name ?? slug
    )
    const resolved = stat.itemSlugs.filter((slug) => itemBySlug.has(slug))
    if (resolved.length < 2) continue

    related.push({
      pairKey: stat.pairKey,
      href: comparisonPath(stat.kindSlug, stat.itemSlugs),
      title: names.join(' vs '),
      viewCount: stat.viewCount
    })

    if (related.length >= limit) break
  }

  return related
}

export const loadRelatedComparisons = cache(
  async (
    kindSlug: string,
    slugs: string[],
    excludePairKey: string | null
  ): Promise<RelatedComparison[]> => {
    const [items, stats] = await Promise.all([
      getItemsByKind(kindSlug),
      listComparisonStats({ kindSlug, limit: 48 })
    ])

    return buildRelatedComparisons(stats, items, slugs, excludePairKey)
  }
)
