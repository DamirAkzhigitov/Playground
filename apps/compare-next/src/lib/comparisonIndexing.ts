import {
  buildPairKey,
  canonicalOrder,
  isCanonicalOrder,
  isIndexableComparison
} from '@/lib/comparison'
import type { Item, SpecDefinition } from '@/types/catalogue'

/** Minimum view count for a non-featured pair to earn indexation. */
export const POPULARITY_INDEX_THRESHOLD = 5_000

/** Both items need at least this share of spec fields filled. */
export const MIN_SPEC_COVERAGE = 0.75

export function specCoveragePercent(
  item: Item,
  specs: SpecDefinition[]
): number {
  if (specs.length === 0) return 0

  const filled = specs.filter((def) => {
    const value = item.specs[def.key]
    return value !== null && value !== undefined && value !== ''
  }).length

  return filled / specs.length
}

export function hasPriceData(item: Item): boolean {
  const msrp = item.specs.msrp_usd
  return typeof msrp === 'number' && Number.isFinite(msrp) && msrp > 0
}

export function hasRichItemData(item: Item, specs: SpecDefinition[]): boolean {
  return (
    specCoveragePercent(item, specs) >= MIN_SPEC_COVERAGE && hasPriceData(item)
  )
}

export type ComparisonIndexingInput = {
  slugs: string[]
  items: Item[]
  specs: SpecDefinition[]
  viewCount?: number
  isFeatured?: boolean
}

/**
 * Tiered indexation: only canonical 2-way pages with editorial, popularity, or
 * rich-data signals are indexable. Everything else is noindex,follow.
 */
export function shouldIndexComparison({
  slugs,
  items,
  specs,
  viewCount = 0,
  isFeatured = false
}: ComparisonIndexingInput): boolean {
  if (!isIndexableComparison(slugs)) return false
  if (!isCanonicalOrder(slugs)) return false
  if (items.length !== 2) return false

  if (isFeatured) return true
  if (viewCount >= POPULARITY_INDEX_THRESHOLD) return true

  return items.every((item) => hasRichItemData(item, specs))
}

export function pairKeyForSlugs(kindSlug: string, slugs: string[]): string {
  return buildPairKey(kindSlug, canonicalOrder(slugs))
}
