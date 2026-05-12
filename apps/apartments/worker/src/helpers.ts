export const typedRows = <T extends Record<string, unknown>>(
  result: D1Result<T>
) => (result.results ?? []) as T[]

export const toQuestion = (
  row: Record<string, unknown>,
  options: Record<string, unknown>[]
): Record<string, unknown> => ({
  id: row.id,
  label: row.label,
  type: row.type,
  categoryId: row.category_id,
  required: Boolean(row.required),
  isArchived: Boolean(row.is_archived),
  order: row.order,
  ratingMin: row.rating_min === null ? null : Number(row.rating_min),
  ratingMax: row.rating_max === null ? null : Number(row.rating_max),
  valuePreference:
    row.value_preference === 'lower' || row.value_preference === 'higher'
      ? row.value_preference
      : null,
  options: options.map((option) => ({
    id: option.id,
    questionId: option.question_id,
    label: option.label,
    value: option.value,
    order: option.order
  }))
})

export const formatApartment = (row: Record<string, unknown>) => ({
  id: row.id,
  title: row.title,
  address: row.address,
  price: row.price,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

export const nowIso = () => new Date().toISOString()
