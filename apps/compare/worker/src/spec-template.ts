import { typedRows, toSpec } from './helpers'

export async function loadSpecTemplate(
  db: D1Database,
  itemTypeId: string,
  includeArchived = false
): Promise<Record<string, unknown>[]> {
  const sectionsResult = await db
    .prepare(
      'SELECT id, name, "order" FROM spec_sections WHERE item_type_id = ? ORDER BY "order" ASC, name ASC'
    )
    .bind(itemTypeId)
    .all()

  const archiveClause = includeArchived
    ? 'WHERE item_type_id = ?'
    : 'WHERE is_archived = 0 AND item_type_id = ?'
  const specsResult = await db
    .prepare(
      `SELECT id, label, type, section_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM specs ${archiveClause} ORDER BY section_id ASC, "order" ASC`
    )
    .bind(itemTypeId)
    .all()

  const specIds = typedRows(specsResult).map((row) => String(row.id))
  const optionsBySpec = new Map<string, Record<string, unknown>[]>()
  if (specIds.length > 0) {
    const placeholders = specIds.map(() => '?').join(',')
    const optionResult = await db
      .prepare(
        `SELECT id, spec_id, label, value, "order" FROM spec_options WHERE spec_id IN (${placeholders}) ORDER BY spec_id ASC, "order" ASC`
      )
      .bind(...specIds)
      .all()
    for (const optionRow of typedRows(optionResult)) {
      const specId = String(optionRow.spec_id)
      const group = optionsBySpec.get(specId) ?? []
      group.push(optionRow)
      optionsBySpec.set(specId, group)
    }
  }

  const specsBySection = new Map<string, Record<string, unknown>[]>()
  for (const specRow of typedRows(specsResult)) {
    const sectionId = String(specRow.section_id)
    const spec = toSpec(specRow, optionsBySpec.get(String(specRow.id)) ?? [])
    const group = specsBySection.get(sectionId) ?? []
    group.push(spec)
    specsBySection.set(sectionId, group)
  }

  return typedRows(sectionsResult).map((section) => ({
    id: section.id,
    name: section.name,
    order: section.order,
    specs: specsBySection.get(String(section.id)) ?? []
  }))
}
