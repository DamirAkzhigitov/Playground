import { INSPECTION_TEMPLATES_BY_SLUG } from './inspectionTemplates'

export async function applyInspectionTemplate(
  db: D1Database,
  userId: string,
  apartmentId: string,
  slug: string
): Promise<void> {
  const template = INSPECTION_TEMPLATES_BY_SLUG[slug]
  if (!template) {
    throw new Error(`Unknown inspection template: ${slug}`)
  }
  const statements: D1PreparedStatement[] = []

  for (const cat of template.categories) {
    const categoryId = crypto.randomUUID()
    statements.push(
      db
        .prepare(
          'INSERT INTO categories (id, name, "order", user_id, apartment_id) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(categoryId, cat.name, cat.order, userId, apartmentId)
    )

    for (const q of cat.questions) {
      const questionId = crypto.randomUUID()
      const stableKey = `${template.slug}/${q.key}`
      const ratingMin = q.type === 'rating' ? (q.ratingMin ?? 1) : null
      const ratingMax = q.type === 'rating' ? (q.ratingMax ?? 5) : null
      statements.push(
        db
          .prepare(
            `INSERT INTO questions (id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, user_id, apartment_id, stable_key)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            questionId,
            q.label,
            q.type,
            categoryId,
            q.required ? 1 : 0,
            q.order,
            ratingMin,
            ratingMax,
            userId,
            apartmentId,
            stableKey
          )
      )

      for (const opt of q.options ?? []) {
        statements.push(
          db
            .prepare(
              'INSERT INTO question_options (id, question_id, label, value, "order") VALUES (?, ?, ?, ?, ?)'
            )
            .bind(
              crypto.randomUUID(),
              questionId,
              opt.label,
              opt.value,
              opt.order
            )
        )
      }
    }
  }

  await db.batch(statements)
}
