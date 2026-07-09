import type { Item, SpecDefinition, SpecValue } from '@/types/catalogue'

export const PAIR_SEPARATOR = '-vs-'

/** True when the URL segment is a multi-item comparison (contains "-vs-"). */
export function isPairSegment(segment: string): boolean {
  return segment.includes(PAIR_SEPARATOR)
}

/** Item slugs must not contain the pair separator (reserved for routing). */
export function isValidItemSlug(slug: string): boolean {
  return slug.length > 0 && !slug.includes(PAIR_SEPARATOR)
}

export function itemPath(kindSlug: string, itemSlug: string): string {
  return `/compare/${kindSlug}/${itemSlug}`
}

/** Split a URL pair segment ("rtx-5080-vs-rtx-3070") into item slugs. */
export function parsePairSegment(segment: string): string[] {
  const slugs = segment
    .split(PAIR_SEPARATOR)
    .map((slug) => slug.trim())
    .filter(Boolean)

  // Dedupe while preserving order.
  return Array.from(new Set(slugs))
}

/** Join item slugs into a URL pair segment. */
export function buildPairSegment(slugs: string[]): string {
  return slugs.join(PAIR_SEPARATOR)
}

/** Canonical (alphabetical, deduped) ordering for stable keys and URLs. */
export function canonicalOrder(slugs: string[]): string[] {
  return Array.from(new Set(slugs)).sort((a, b) => a.localeCompare(b))
}

/** Stable key for a comparison, independent of order. */
export function buildPairKey(kindSlug: string, slugs: string[]): string {
  return `${kindSlug}:${canonicalOrder(slugs).join('|')}`
}

export function comparisonPath(kindSlug: string, slugs: string[]): string {
  return `/compare/${kindSlug}/${buildPairSegment(slugs)}`
}

/** Comparison path using canonical slug order (used for canonical tags). */
export function canonicalComparisonPath(
  kindSlug: string,
  slugs: string[]
): string {
  return comparisonPath(kindSlug, canonicalOrder(slugs))
}

export function kindHubPath(kindSlug: string): string {
  return `/compare/${kindSlug}`
}

/** True when the given order already matches the canonical order. */
export function isCanonicalOrder(slugs: string[]): boolean {
  const canonical = canonicalOrder(slugs)
  return (
    slugs.length === canonical.length &&
    slugs.every((slug, index) => slug === canonical[index])
  )
}

/** Only 2-way comparisons are indexable; 3+ are noindex to avoid crawl bloat. */
export function isIndexableComparison(slugs: string[]): boolean {
  return slugs.length === 2
}

function toNumber(value: SpecValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return null
}

function hasMeaningfulDifference(
  best: number,
  next: number,
  minimumDifferencePercent: number
): boolean {
  if (minimumDifferencePercent <= 0) return best !== next

  const baseline = Math.max(Math.abs(best), Math.abs(next))
  if (baseline === 0) return false

  return (Math.abs(best - next) / baseline) * 100 >= minimumDifferencePercent
}

/**
 * For a numeric ranked spec, return the slugs of the winning item(s).
 * Identical values do not produce winners. Informational specs otherwise display
 * their raw winner; primary and trade-off specs require a meaningful difference.
 */
export function computeWinners(
  items: Item[],
  def: SpecDefinition
): Set<string> {
  if (def.valueType !== 'number' || def.higherIsBetter === null) {
    return new Set()
  }

  const values = items
    .map((item) => ({ slug: item.slug, value: toNumber(item.specs[def.key]) }))
    .filter(
      (entry): entry is { slug: string; value: number } => entry.value !== null
    )

  if (values.length < 2) return new Set()

  const best = values.reduce((acc, entry) => {
    if (def.higherIsBetter) return Math.max(acc, entry.value)
    return Math.min(acc, entry.value)
  }, values[0].value)

  const winners = values.filter((entry) => entry.value === best)
  const otherValues = values.filter((entry) => entry.value !== best)
  if (otherValues.length === 0) {
    return new Set()
  }

  if (def.comparisonRole === 'informational') {
    return new Set(winners.map((entry) => entry.slug))
  }

  if (
    !otherValues.some((entry) =>
      hasMeaningfulDifference(best, entry.value, def.minimumDifferencePercent)
    )
  ) {
    return new Set()
  }

  return new Set(winners.map((entry) => entry.slug))
}

/** Human-readable value for a spec cell. */
export function formatSpecValue(value: SpecValue, def: SpecDefinition): string {
  if (value === null || value === undefined || value === '') return '—'

  if (def.valueType === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (def.valueType === 'number' && typeof value === 'number') {
    const formatted = value.toLocaleString('en-US')
    if (!def.unit) return formatted
    if (def.unit === '$') return `$${formatted}`
    return `${formatted} ${def.unit}`
  }

  return String(value)
}

/** Build a display title like "RTX 5080 vs RTX 3070" from item names. */
export function comparisonTitleFromNames(names: string[]): string {
  return names.join(' vs ')
}
