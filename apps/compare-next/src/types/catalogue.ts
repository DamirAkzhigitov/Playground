export type CatalogueCardSize = 'default' | 'wide' | 'tall' | 'featured'

export type CatalogueSort = 'new' | 'hot' | 'popular'

/**
 * A catalogue card on the home / new / hot / popular pages. Each card is a
 * curated or popular comparison that links to a derived comparison page.
 */
export type CatalogueEntry = {
  id: string
  title: string
  description: string
  badge: string
  imageUrl: string
  size: CatalogueCardSize
  publishedAt: string
  viewCount: number
  href: string
}

export type SpecValueType = 'number' | 'text' | 'boolean'

export type SpecValue = string | number | boolean | null

/** A comparable category (GPU, Phone, ...). */
export type Kind = {
  id: string
  slug: string
  name: string
  namePlural: string
  description: string
}

/** Per-kind description of one spec row: how to label, format, and rank it. */
export type SpecDefinition = {
  key: string
  label: string
  unit: string | null
  valueType: SpecValueType
  /** true = higher wins, false = lower wins (price/latency), null = not ranked. */
  higherIsBetter: boolean | null
  group: string | null
  sortOrder: number
}

/** A single product within a kind. Specs are a flat key/value map. */
export type Item = {
  id: string
  kindSlug: string
  slug: string
  name: string
  brand: string | null
  imageUrl: string | null
  releaseDate: string | null
  viewCount: number
  specs: Record<string, SpecValue>
}

/** Pointer + counter for a comparison. Never stores comparison content. */
export type ComparisonStat = {
  pairKey: string
  kindSlug: string
  itemSlugs: string[]
  viewCount: number
  isFeatured: boolean
  createdAt: string
}
