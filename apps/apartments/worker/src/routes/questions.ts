import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { typedRows, toQuestion } from '../helpers'

const questionTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multi-select',
  'rating'
])

const questionOptionSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  order: z.number().int().min(0)
})

const questionSchema = z.object({
  label: z.string().trim().min(1).max(300),
  type: questionTypeSchema,
  categoryId: z.string().trim().min(1),
  required: z.boolean(),
  order: z.number().int().min(0).optional(),
  ratingMin: z.number().int().nullable().optional(),
  ratingMax: z.number().int().nullable().optional(),
  options: z.array(questionOptionSchema).optional()
})

const questionPatchSchema = z
  .object({
    label: z.string().trim().min(1).max(300).optional(),
    type: questionTypeSchema.optional(),
    categoryId: z.string().trim().min(1).optional(),
    required: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    ratingMin: z.number().int().nullable().optional(),
    ratingMax: z.number().int().nullable().optional(),
    options: z.array(questionOptionSchema).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const reorderQuestionsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        order: z.number().int().min(0)
      })
    )
    .min(1)
})

const questions = new Hono<AppEnv>()

questions.get('/', async (c) => {
  const userId = c.get('userId')
  const includeArchived = c.req.query('includeArchived') === 'true'
  const apartmentId = c.req.query('apartmentId')?.trim()

  let categorySql = 'user_id = ? AND apartment_id IS NULL'
  const categoryBind: string[] = [userId]

  let questionScopeSql = 'user_id = ? AND apartment_id IS NULL'
  const questionScopeBind: string[] = [userId]

  if (apartmentId) {
    const owns = await c.env.DB.prepare(
      'SELECT 1 FROM apartments WHERE id = ? AND user_id = ?'
    )
      .bind(apartmentId, userId)
      .first()
    if (!owns) {
      return c.json({ error: 'Apartment not found' }, 404)
    }
    const scoped = await c.env.DB.prepare(
      'SELECT 1 FROM questions WHERE user_id = ? AND apartment_id = ? LIMIT 1'
    )
      .bind(userId, apartmentId)
      .first()
    if (scoped) {
      categorySql = 'user_id = ? AND apartment_id = ?'
      categoryBind.push(apartmentId)
      questionScopeSql = 'user_id = ? AND apartment_id = ?'
      questionScopeBind.push(apartmentId)
    }
  }

  const categoriesResult = await c.env.DB.prepare(
    `SELECT id, name, "order" FROM categories WHERE ${categorySql} ORDER BY "order" ASC, name ASC`
  )
    .bind(...categoryBind)
    .all()

  const archiveClause = includeArchived
    ? `WHERE ${questionScopeSql}`
    : `WHERE is_archived = 0 AND ${questionScopeSql}`
  const questionResult = await c.env.DB.prepare(
    `SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, stable_key FROM questions ${archiveClause} ORDER BY category_id ASC, "order" ASC`
  )
    .bind(...questionScopeBind)
    .all()

  const questionIds = typedRows(questionResult).map((q) => String(q.id))
  let optionsByQuestion = new Map<string, Record<string, unknown>[]>()
  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => '?').join(',')
    const optionResult = await c.env.DB.prepare(
      `SELECT id, question_id, label, value, "order" FROM question_options WHERE question_id IN (${placeholders}) ORDER BY question_id ASC, "order" ASC`
    )
      .bind(...questionIds)
      .all()
    for (const optionRow of typedRows(optionResult)) {
      const questionId = String(optionRow.question_id)
      const group = optionsByQuestion.get(questionId) ?? []
      group.push(optionRow)
      optionsByQuestion.set(questionId, group)
    }
  }

  const questionsByCategory = new Map<string, Record<string, unknown>[]>()
  for (const questionRow of typedRows(questionResult)) {
    const categoryId = String(questionRow.category_id)
    const question = toQuestion(
      questionRow,
      optionsByQuestion.get(String(questionRow.id)) ?? []
    )
    const group = questionsByCategory.get(categoryId) ?? []
    group.push(question)
    questionsByCategory.set(categoryId, group)
  }

  const grouped = typedRows(categoriesResult).map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order,
    questions: questionsByCategory.get(String(category.id)) ?? []
  }))

  return c.json(grouped)
})

questions.post('/', async (c) => {
  const userId = c.get('userId')
  const payload = questionSchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const order =
    payload.order ??
    ((
      await c.env.DB.prepare(
        'SELECT COALESCE(MAX("order"), 0) AS value FROM questions WHERE category_id = ? AND user_id = ?'
      )
        .bind(payload.categoryId, userId)
        .first<{ value: number }>()
    )?.value ?? 0) + 1

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      'INSERT INTO questions (id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, user_id, apartment_id, stable_key) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NULL, NULL)'
    ).bind(
      id,
      payload.label,
      payload.type,
      payload.categoryId,
      payload.required ? 1 : 0,
      order,
      payload.type === 'rating' ? (payload.ratingMin ?? 1) : null,
      payload.type === 'rating' ? (payload.ratingMax ?? 5) : null,
      userId
    )
  ]

  for (const option of payload.options ?? []) {
    statements.push(
      c.env.DB.prepare(
        'INSERT INTO question_options (id, question_id, label, value, "order") VALUES (?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), id, option.label, option.value, option.order)
    )
  }

  await c.env.DB.batch(statements)
  return c.json({ id, ...payload, order, isArchived: false }, 201)
})

questions.patch('/reorder', async (c) => {
  const userId = c.get('userId')
  const payload = reorderQuestionsSchema.parse(await c.req.json())
  const statements = payload.items.map((item) =>
    c.env.DB.prepare(
      'UPDATE questions SET "order" = ? WHERE id = ? AND user_id = ?'
    ).bind(item.order, item.id, userId)
  )
  await c.env.DB.batch(statements)
  return c.json({ ok: true })
})

questions.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = questionPatchSchema.parse(await c.req.json())
  await c.env.DB.prepare(
    `UPDATE questions
     SET label = COALESCE(?, label),
         type = COALESCE(?, type),
         category_id = COALESCE(?, category_id),
         required = COALESCE(?, required),
         is_archived = COALESCE(?, is_archived),
         "order" = COALESCE(?, "order"),
         rating_min = CASE
           WHEN COALESCE(?, type) = 'rating' THEN COALESCE(?, rating_min, 1)
           ELSE NULL
         END,
         rating_max = CASE
           WHEN COALESCE(?, type) = 'rating' THEN COALESCE(?, rating_max, 5)
           ELSE NULL
         END
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      payload.label ?? null,
      payload.type ?? null,
      payload.categoryId ?? null,
      payload.required === undefined ? null : payload.required ? 1 : 0,
      payload.isArchived === undefined ? null : payload.isArchived ? 1 : 0,
      payload.order ?? null,
      payload.type ?? null,
      payload.ratingMin ?? null,
      payload.type ?? null,
      payload.ratingMax ?? null,
      id,
      userId
    )
    .run()

  if (payload.options) {
    const statements: D1PreparedStatement[] = [
      c.env.DB.prepare(
        'DELETE FROM question_options WHERE question_id = ?'
      ).bind(id)
    ]
    for (const option of payload.options) {
      statements.push(
        c.env.DB.prepare(
          'INSERT INTO question_options (id, question_id, label, value, "order") VALUES (?, ?, ?, ?, ?)'
        ).bind(
          crypto.randomUUID(),
          id,
          option.label,
          option.value,
          option.order
        )
      )
    }
    await c.env.DB.batch(statements)
  }

  const question = await c.env.DB.prepare(
    'SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, stable_key FROM questions WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<Record<string, unknown>>()
  if (!question) {
    return c.json({ error: 'Question not found' }, 404)
  }

  const options = await c.env.DB.prepare(
    'SELECT id, question_id, label, value, "order" FROM question_options WHERE question_id = ? ORDER BY "order" ASC'
  )
    .bind(id)
    .all<Record<string, unknown>>()

  return c.json(toQuestion(question, typedRows(options)))
})

export { questions }
