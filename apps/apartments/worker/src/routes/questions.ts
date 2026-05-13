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

const valuePreferenceSchema = z.enum(['higher', 'lower'])

const questionOptionSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  order: z.number().int().min(0)
})

function valuePreferenceForCreate(
  type: z.infer<typeof questionTypeSchema>,
  pref: z.infer<typeof valuePreferenceSchema> | undefined
): z.infer<typeof valuePreferenceSchema> | null {
  if (type === 'number') {
    return pref ?? 'higher'
  }
  if (type === 'date') {
    return pref ?? 'lower'
  }
  return null
}

const questionSchema = z.object({
  label: z.string().trim().min(1).max(300),
  type: questionTypeSchema,
  categoryId: z.string().trim().min(1),
  required: z.boolean(),
  order: z.number().int().min(0).optional(),
  ratingMin: z.number().int().nullable().optional(),
  ratingMax: z.number().int().nullable().optional(),
  valuePreference: valuePreferenceSchema.optional(),
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
    valuePreference: valuePreferenceSchema.optional(),
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
  const categoriesResult = await c.env.DB.prepare(
    'SELECT id, name, "order" FROM categories WHERE user_id = ? ORDER BY "order" ASC, name ASC'
  )
    .bind(userId)
    .all()

  const archiveClause = includeArchived
    ? 'WHERE user_id = ?'
    : 'WHERE is_archived = 0 AND user_id = ?'
  const questionResult = await c.env.DB.prepare(
    `SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM questions ${archiveClause} ORDER BY category_id ASC, "order" ASC`
  )
    .bind(userId)
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

  const storedPreference = valuePreferenceForCreate(
    payload.type,
    payload.valuePreference
  )

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      'INSERT INTO questions (id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, value_preference, user_id) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      payload.label,
      payload.type,
      payload.categoryId,
      payload.required ? 1 : 0,
      order,
      payload.type === 'rating' ? (payload.ratingMin ?? 1) : null,
      payload.type === 'rating' ? (payload.ratingMax ?? 5) : null,
      storedPreference,
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
  return c.json(
    {
      id,
      ...payload,
      order,
      isArchived: false,
      valuePreference: storedPreference
    },
    201
  )
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

  const existing = await c.env.DB.prepare(
    'SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM questions WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<Record<string, unknown>>()

  if (!existing) {
    return c.json({ error: 'Question not found' }, 404)
  }

  const prevType = String(existing.type)
  const nextType = payload.type ?? prevType
  const nextLabel = payload.label ?? String(existing.label)
  const nextCategoryId = payload.categoryId ?? String(existing.category_id)
  const nextRequired =
    payload.required !== undefined
      ? payload.required
      : Boolean(existing.required)
  const nextArchived =
    payload.isArchived !== undefined
      ? payload.isArchived
      : Boolean(existing.is_archived)
  const nextOrder =
    payload.order !== undefined ? payload.order : Number(existing.order)

  let nextRatingMin: number | null
  let nextRatingMax: number | null
  if (nextType === 'rating') {
    nextRatingMin =
      payload.ratingMin !== undefined
        ? payload.ratingMin
        : existing.rating_min !== null && existing.rating_min !== undefined
          ? Number(existing.rating_min)
          : 1
    nextRatingMax =
      payload.ratingMax !== undefined
        ? payload.ratingMax
        : existing.rating_max !== null && existing.rating_max !== undefined
          ? Number(existing.rating_max)
          : 5
  } else {
    nextRatingMin = null
    nextRatingMax = null
  }

  let nextValuePreference: string | null
  if (nextType !== 'number' && nextType !== 'date') {
    nextValuePreference = null
  } else if (payload.valuePreference !== undefined) {
    nextValuePreference = payload.valuePreference
  } else if (payload.type !== undefined && payload.type !== prevType) {
    nextValuePreference = nextType === 'number' ? 'higher' : 'lower'
  } else if (
    existing.value_preference === 'higher' ||
    existing.value_preference === 'lower'
  ) {
    nextValuePreference = String(existing.value_preference)
  } else {
    nextValuePreference = null
  }

  await c.env.DB.prepare(
    `UPDATE questions
     SET label = ?,
         type = ?,
         category_id = ?,
         required = ?,
         is_archived = ?,
         "order" = ?,
         rating_min = ?,
         rating_max = ?,
         value_preference = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      nextLabel,
      nextType,
      nextCategoryId,
      nextRequired ? 1 : 0,
      nextArchived ? 1 : 0,
      nextOrder,
      nextRatingMin,
      nextRatingMax,
      nextValuePreference,
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
    'SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM questions WHERE id = ? AND user_id = ?'
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
