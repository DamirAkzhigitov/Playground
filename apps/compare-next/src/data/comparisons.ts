import { getDb } from '@/data/db'
import type {
  ComparisonRole,
  ComparisonStat,
  Item,
  Kind,
  SpecDefinition,
  SpecValue,
  SpecValueType
} from '@/types/catalogue'

type KindRow = {
  id: string
  slug: string
  name: string
  name_plural: string
  description: string
}

type ItemRow = {
  id: string
  slug: string
  name: string
  brand: string | null
  image_url: string | null
  release_date: string | null
  view_count: number
  specs_json: string
  kind_slug: string
}

type SpecDefinitionRow = {
  key: string
  label: string
  unit: string | null
  value_type: string
  higher_is_better: number | null
  comparison_role: string
  comparison_weight: number
  minimum_difference_percent: number
  group_label: string | null
  sort_order: number
}

function parseComparisonRole(value: string): ComparisonRole {
  if (
    value === 'primary' ||
    value === 'tradeoff' ||
    value === 'informational'
  ) {
    return value
  }

  throw new Error(`Invalid comparison role: ${value}`)
}

type ComparisonStatRow = {
  pair_key: string
  item_slugs_json: string
  view_count: number
  is_featured: number
  created_at: string
  kind_slug: string
}

function mapKind(row: KindRow): Kind {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    namePlural: row.name_plural,
    description: row.description
  }
}

function parseSpecs(json: string): Record<string, SpecValue> {
  try {
    const parsed = JSON.parse(json) as Record<string, SpecValue>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    kindSlug: row.kind_slug,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    imageUrl: row.image_url,
    releaseDate: row.release_date,
    viewCount: row.view_count,
    specs: parseSpecs(row.specs_json)
  }
}

function mapSpecDefinition(row: SpecDefinitionRow): SpecDefinition {
  return {
    key: row.key,
    label: row.label,
    unit: row.unit,
    valueType: (row.value_type as SpecValueType) ?? 'text',
    higherIsBetter:
      row.higher_is_better === null ? null : row.higher_is_better === 1,
    comparisonRole: parseComparisonRole(row.comparison_role),
    comparisonWeight: row.comparison_weight,
    minimumDifferencePercent: row.minimum_difference_percent,
    group: row.group_label,
    sortOrder: row.sort_order
  }
}

function parseSlugs(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function mapComparisonStat(row: ComparisonStatRow): ComparisonStat {
  return {
    pairKey: row.pair_key,
    kindSlug: row.kind_slug,
    itemSlugs: parseSlugs(row.item_slugs_json),
    viewCount: row.view_count,
    isFeatured: row.is_featured === 1,
    createdAt: row.created_at
  }
}

export async function listKinds(): Promise<Kind[]> {
  const db = await getDb()
  const { results } = await db
    .prepare('SELECT * FROM kinds ORDER BY name')
    .all<KindRow>()
  return results.map(mapKind)
}

export async function getKindBySlug(slug: string): Promise<Kind | null> {
  const db = await getDb()
  const row = await db
    .prepare('SELECT * FROM kinds WHERE slug = ?')
    .bind(slug)
    .first<KindRow>()
  return row ? mapKind(row) : null
}

export async function getSpecDefinitions(
  kindSlug: string
): Promise<SpecDefinition[]> {
  const db = await getDb()
  const { results } = await db
    .prepare(
      `SELECT sd.* FROM spec_definitions sd
       JOIN kinds k ON k.id = sd.kind_id
       WHERE k.slug = ?
       ORDER BY sd.sort_order, sd.label`
    )
    .bind(kindSlug)
    .all<SpecDefinitionRow>()
  return results.map(mapSpecDefinition)
}

export async function getItemBySlug(
  kindSlug: string,
  slug: string
): Promise<Item | null> {
  const db = await getDb()
  const row = await db
    .prepare(
      `SELECT i.*, k.slug AS kind_slug FROM items i
       JOIN kinds k ON k.id = i.kind_id
       WHERE k.slug = ? AND i.slug = ?`
    )
    .bind(kindSlug, slug)
    .first<ItemRow>()

  return row ? mapItem(row) : null
}

export async function getItemsByKind(kindSlug: string): Promise<Item[]> {
  const db = await getDb()
  const { results } = await db
    .prepare(
      `SELECT i.*, k.slug AS kind_slug FROM items i
       JOIN kinds k ON k.id = i.kind_id
       WHERE k.slug = ?
       ORDER BY i.view_count DESC, i.name`
    )
    .bind(kindSlug)
    .all<ItemRow>()
  return results.map(mapItem)
}

export async function getItemsBySlugs(
  kindSlug: string,
  slugs: string[]
): Promise<Item[]> {
  if (slugs.length === 0) return []

  const db = await getDb()
  const placeholders = slugs.map(() => '?').join(', ')
  const { results } = await db
    .prepare(
      `SELECT i.*, k.slug AS kind_slug FROM items i
       JOIN kinds k ON k.id = i.kind_id
       WHERE k.slug = ? AND i.slug IN (${placeholders})`
    )
    .bind(kindSlug, ...slugs)
    .all<ItemRow>()

  const bySlug = new Map(results.map((row) => [row.slug, mapItem(row)]))
  // Preserve the requested order (matches the URL / picker order).
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((item): item is Item => item !== undefined)
}

type ListComparisonStatsOptions = {
  kindSlug?: string
  featuredOnly?: boolean
  limit?: number
}

export async function listComparisonStats({
  kindSlug,
  featuredOnly = false,
  limit = 50
}: ListComparisonStatsOptions = {}): Promise<ComparisonStat[]> {
  const db = await getDb()
  const conditions: string[] = []
  const bindings: (string | number)[] = []

  if (kindSlug) {
    conditions.push('k.slug = ?')
    bindings.push(kindSlug)
  }
  if (featuredOnly) {
    conditions.push('cs.is_featured = 1')
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  bindings.push(limit)

  const { results } = await db
    .prepare(
      `SELECT cs.*, k.slug AS kind_slug FROM comparison_stats cs
       JOIN kinds k ON k.id = cs.kind_id
       ${where}
       ORDER BY cs.view_count DESC
       LIMIT ?`
    )
    .bind(...bindings)
    .all<ComparisonStatRow>()

  return results.map(mapComparisonStat)
}

export async function getComparisonStat(
  kindSlug: string,
  pairKey: string
): Promise<ComparisonStat | null> {
  const db = await getDb()
  const row = await db
    .prepare(
      `SELECT cs.*, k.slug AS kind_slug FROM comparison_stats cs
       JOIN kinds k ON k.id = cs.kind_id
       WHERE k.slug = ? AND cs.pair_key = ?`
    )
    .bind(kindSlug, pairKey)
    .first<ComparisonStatRow>()

  return row ? mapComparisonStat(row) : null
}

export async function recordComparisonView(
  kindSlug: string,
  pairKey: string,
  itemSlugs: string[]
): Promise<void> {
  const db = await getDb()
  const kind = await db
    .prepare('SELECT id FROM kinds WHERE slug = ?')
    .bind(kindSlug)
    .first<{ id: string }>()

  if (!kind) return

  await db
    .prepare(
      `INSERT INTO comparison_stats (pair_key, kind_id, item_slugs_json, view_count, last_viewed_at)
       VALUES (?, ?, ?, 1, datetime('now'))
       ON CONFLICT(pair_key) DO UPDATE SET
         view_count = view_count + 1,
         last_viewed_at = datetime('now')`
    )
    .bind(pairKey, kind.id, JSON.stringify(itemSlugs))
    .run()
}
