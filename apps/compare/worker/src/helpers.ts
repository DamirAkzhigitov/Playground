export const typedRows = <T extends Record<string, unknown>>(
  result: D1Result<T>
) => (result.results ?? []) as T[]

export const toSpec = (
  row: Record<string, unknown>,
  options: Record<string, unknown>[]
): Record<string, unknown> => ({
  id: row.id,
  label: row.label,
  type: row.type,
  sectionId: row.section_id,
  required: Boolean(row.required),
  isArchived: Boolean(row.is_archived),
  order: row.order,
  ratingMin: row.rating_min === null ? null : Number(row.rating_min),
  ratingMax: row.rating_max === null ? null : Number(row.rating_max),
  valuePreference:
    row.value_preference === 'higher' || row.value_preference === 'lower'
      ? row.value_preference
      : null,
  options: options.map((option) => ({
    id: option.id,
    specId: option.spec_id,
    label: option.label,
    value: option.value,
    order: option.order
  }))
})

export const formatItemType = (row: Record<string, unknown>) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  icon: row.icon ?? null,
  isSystem: Boolean(row.is_system),
  userId: row.user_id ?? null,
  order: Number(row.order ?? 0),
  createdAt: row.created_at
})

export const formatItem = (row: Record<string, unknown>) => ({
  id: row.id,
  itemTypeId: row.item_type_id,
  title: row.title,
  notes: row.notes,
  isPublic: Boolean(row.is_public),
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const formatCompareGroup = (row: Record<string, unknown>) => ({
  id: row.id,
  title: row.title,
  itemTypeId: row.item_type_id,
  isPublic: Boolean(row.is_public),
  selectionMode: row.selection_mode,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const nowIso = () => new Date().toISOString()

export const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'type'
