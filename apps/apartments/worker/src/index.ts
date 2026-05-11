import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import * as XLSX from 'xlsx'

type Bindings = {
  DB: D1Database
  PHOTOS: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()
const localhostPattern = /^http:\/\/localhost:\d+$/
const nowIso = () => new Date().toISOString()

const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  order: z.number().int().min(0).optional()
})

const categoryPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    order: z.number().int().min(0).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const questionTypeSchema = z.enum([
  'text',
  'number',
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

const apartmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).nullable().optional(),
  price: z.number().finite().nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional()
})

const apartmentPatchSchema = apartmentSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const answerInputSchema = z.object({
  apartmentId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  value: z.string().nullable(),
  note: z.string().trim().nullable().optional()
})

const answersPayloadSchema = z.union([
  z.object({ answer: answerInputSchema }),
  z.object({ answers: z.array(answerInputSchema).min(1) })
])

const typedRows = <T extends Record<string, unknown>>(result: D1Result<T>) =>
  (result.results ?? []) as T[]

const toQuestion = (
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
  options: options.map((option) => ({
    id: option.id,
    questionId: option.question_id,
    label: option.label,
    value: option.value,
    order: option.order
  }))
})

const formatApartment = (row: Record<string, unknown>) => ({
  id: row.id,
  title: row.title,
  address: row.address,
  price: row.price,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at
})

const uploadPhotoSchema = z.object({
  apartmentId: z.string().trim().min(1),
  questionId: z.string().trim().min(1).optional()
})
type UploadFile = {
  name: string
  type?: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

const isUploadFile = (value: unknown): value is UploadFile =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  'arrayBuffer' in value &&
  typeof (value as UploadFile).name === 'string' &&
  typeof (value as UploadFile).arrayBuffer === 'function'

const exportTableNames = [
  'categories',
  'questions',
  'question_options',
  'apartments',
  'answers',
  'photos'
] as const

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return ''
      }
      if (
        origin === 'https://apartments.da-mr.com' ||
        localhostPattern.test(origin)
      ) {
        return origin
      }
      return ''
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE']
  })
)

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/categories', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, name, "order" FROM categories ORDER BY "order" ASC, name ASC'
  ).all()
  return c.json(typedRows(result))
})

app.post('/api/categories', async (c) => {
  const payload = categorySchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const order =
    payload.order ??
    ((
      await c.env.DB.prepare(
        'SELECT COALESCE(MAX("order"), 0) AS value FROM categories'
      ).first<{
        value: number
      }>()
    )?.value ?? 0) + 1
  await c.env.DB.prepare(
    'INSERT INTO categories (id, name, "order") VALUES (?, ?, ?)'
  )
    .bind(id, payload.name, order)
    .run()
  return c.json({ id, name: payload.name, order }, 201)
})

app.patch('/api/categories/:id', async (c) => {
  const id = c.req.param('id')
  const payload = categoryPatchSchema.parse(await c.req.json())
  await c.env.DB.prepare(
    'UPDATE categories SET name = COALESCE(?, name), "order" = COALESCE(?, "order") WHERE id = ?'
  )
    .bind(payload.name ?? null, payload.order ?? null, id)
    .run()
  const updated = await c.env.DB.prepare(
    'SELECT id, name, "order" FROM categories WHERE id = ?'
  )
    .bind(id)
    .first()
  if (!updated) {
    return c.json({ error: 'Category not found' }, 404)
  }
  return c.json(updated)
})

app.delete('/api/categories/:id', async (c) => {
  const id = c.req.param('id')
  const linked = await c.env.DB.prepare(
    'SELECT COUNT(*) AS value FROM questions WHERE category_id = ?'
  )
    .bind(id)
    .first<{ value: number }>()
  if ((linked?.value ?? 0) > 0) {
    return c.json(
      { error: 'Cannot delete category with attached questions' },
      409
    )
  }
  const result = await c.env.DB.prepare('DELETE FROM categories WHERE id = ?')
    .bind(id)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Category not found' }, 404)
  }
  return c.body(null, 204)
})

app.get('/api/questions', async (c) => {
  const includeArchived = c.req.query('includeArchived') === 'true'
  const categoriesResult = await c.env.DB.prepare(
    'SELECT id, name, "order" FROM categories ORDER BY "order" ASC, name ASC'
  ).all()
  const questionResult = await c.env.DB.prepare(
    `SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max FROM questions ${
      includeArchived ? '' : 'WHERE is_archived = 0'
    } ORDER BY category_id ASC, "order" ASC`
  ).all()
  const optionResult = await c.env.DB.prepare(
    'SELECT id, question_id, label, value, "order" FROM question_options ORDER BY question_id ASC, "order" ASC'
  ).all()

  const optionsByQuestion = new Map<string, Record<string, unknown>[]>()
  for (const optionRow of typedRows(optionResult)) {
    const questionId = String(optionRow.question_id)
    const group = optionsByQuestion.get(questionId) ?? []
    group.push(optionRow)
    optionsByQuestion.set(questionId, group)
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

app.post('/api/questions', async (c) => {
  const payload = questionSchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const order =
    payload.order ??
    ((
      await c.env.DB.prepare(
        'SELECT COALESCE(MAX("order"), 0) AS value FROM questions WHERE category_id = ?'
      )
        .bind(payload.categoryId)
        .first<{ value: number }>()
    )?.value ?? 0) + 1

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      'INSERT INTO questions (id, label, type, category_id, required, is_archived, "order", rating_min, rating_max) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)'
    ).bind(
      id,
      payload.label,
      payload.type,
      payload.categoryId,
      payload.required ? 1 : 0,
      order,
      payload.type === 'rating' ? (payload.ratingMin ?? 1) : null,
      payload.type === 'rating' ? (payload.ratingMax ?? 5) : null
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

app.patch('/api/questions/reorder', async (c) => {
  const payload = reorderQuestionsSchema.parse(await c.req.json())
  const statements = payload.items.map((item) =>
    c.env.DB.prepare('UPDATE questions SET "order" = ? WHERE id = ?').bind(
      item.order,
      item.id
    )
  )
  await c.env.DB.batch(statements)
  return c.json({ ok: true })
})

app.patch('/api/questions/:id', async (c) => {
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
     WHERE id = ?`
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
      id
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
    'SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max FROM questions WHERE id = ?'
  )
    .bind(id)
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

app.get('/api/apartments', async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT
       a.id,
       a.title,
       a.address,
       a.price,
       a.notes,
       a.created_at,
       a.updated_at,
       (SELECT COUNT(*) FROM questions q WHERE q.is_archived = 0) AS total_questions,
       (
         SELECT COUNT(*)
         FROM questions q
         INNER JOIN answers ans
           ON ans.question_id = q.id AND ans.apartment_id = a.id
         WHERE q.is_archived = 0
           AND ans.value IS NOT NULL
           AND TRIM(ans.value) != ''
           AND TRIM(ans.value) != '[]'
           AND (
             q.type != 'multi-select'
             OR (
               json_valid(TRIM(ans.value)) = 1
               AND json_type(TRIM(ans.value)) = 'array'
               AND json_array_length(TRIM(ans.value)) > 0
             )
           )
       ) AS answered_questions,
       (
         SELECT COUNT(*)
         FROM questions q
         LEFT JOIN answers ans
           ON ans.question_id = q.id AND ans.apartment_id = a.id
         WHERE q.is_archived = 0
           AND q.required = 1
           AND NOT (
             ans.id IS NOT NULL
             AND ans.value IS NOT NULL
             AND TRIM(ans.value) != ''
             AND TRIM(ans.value) != '[]'
             AND (
               q.type != 'multi-select'
               OR (
                 json_valid(TRIM(ans.value)) = 1
                 AND json_type(TRIM(ans.value)) = 'array'
                 AND json_array_length(TRIM(ans.value)) > 0
               )
             )
           )
       ) AS critical_missing
     FROM apartments a
     ORDER BY a.created_at DESC`
  ).all<Record<string, unknown>>()

  const apartments = typedRows(result).map((row) => {
    const answered = Number(row.answered_questions ?? 0)
    const total = Number(row.total_questions ?? 0)
    const criticalMissing = Number(row.critical_missing ?? 0)
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0
    return {
      ...formatApartment(row),
      completion: {
        answeredQuestions: answered,
        totalQuestions: total,
        percent,
        criticalMissingCount: criticalMissing
      }
    }
  })
  return c.json(apartments)
})

app.post('/api/apartments', async (c) => {
  const payload = apartmentSchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const timestamp = nowIso()
  await c.env.DB.prepare(
    'INSERT INTO apartments (id, title, address, price, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(
      id,
      payload.title,
      payload.address ?? null,
      payload.price ?? null,
      payload.notes ?? null,
      timestamp,
      timestamp
    )
    .run()
  return c.json(
    {
      id,
      title: payload.title,
      address: payload.address ?? null,
      price: payload.price ?? null,
      notes: payload.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    201
  )
})

app.patch('/api/apartments/:id', async (c) => {
  const id = c.req.param('id')
  const payload = apartmentPatchSchema.parse(await c.req.json())
  const timestamp = nowIso()
  const result = await c.env.DB.prepare(
    `UPDATE apartments
     SET title = COALESCE(?, title),
         address = COALESCE(?, address),
         price = COALESCE(?, price),
         notes = COALESCE(?, notes),
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      payload.title ?? null,
      payload.address ?? null,
      payload.price ?? null,
      payload.notes ?? null,
      timestamp,
      id
    )
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Apartment not found' }, 404)
  }

  const apartment = await c.env.DB.prepare(
    'SELECT id, title, address, price, notes, created_at, updated_at FROM apartments WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()
  return c.json(formatApartment(apartment ?? {}))
})

app.get('/api/apartments/:id', async (c) => {
  const id = c.req.param('id')
  const apartment = await c.env.DB.prepare(
    'SELECT id, title, address, price, notes, created_at, updated_at FROM apartments WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()
  if (!apartment) {
    return c.json({ error: 'Apartment not found' }, 404)
  }

  const answersResult = await c.env.DB.prepare(
    'SELECT id, apartment_id, question_id, value, note, updated_at FROM answers WHERE apartment_id = ? ORDER BY updated_at DESC'
  )
    .bind(id)
    .all<Record<string, unknown>>()
  const photosResult = await c.env.DB.prepare(
    'SELECT id, apartment_id, question_id, r2_key, created_at FROM photos WHERE apartment_id = ? ORDER BY created_at DESC'
  )
    .bind(id)
    .all<Record<string, unknown>>()

  return c.json({
    ...formatApartment(apartment),
    answers: typedRows(answersResult).map((row) => ({
      id: row.id,
      apartmentId: row.apartment_id,
      questionId: row.question_id,
      value: row.value,
      note: row.note,
      updatedAt: row.updated_at
    })),
    photos: typedRows(photosResult).map((row) => ({
      id: row.id,
      apartmentId: row.apartment_id,
      questionId: row.question_id,
      r2Key: row.r2_key,
      createdAt: row.created_at
    }))
  })
})

app.delete('/api/apartments/:id', async (c) => {
  const id = c.req.param('id')
  const photos = await c.env.DB.prepare(
    'SELECT r2_key FROM photos WHERE apartment_id = ?'
  )
    .bind(id)
    .all<{ r2_key: string }>()
  await Promise.all(
    typedRows(photos).map((photo) => c.env.PHOTOS.delete(photo.r2_key))
  )
  const result = await c.env.DB.prepare('DELETE FROM apartments WHERE id = ?')
    .bind(id)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Apartment not found' }, 404)
  }
  return c.body(null, 204)
})

app.post('/api/answers', async (c) => {
  const payload = answersPayloadSchema.parse(await c.req.json())
  const answers = 'answer' in payload ? [payload.answer] : payload.answers
  const timestamp = nowIso()

  const statements = answers.map((answer) =>
    c.env.DB.prepare(
      `INSERT INTO answers (id, apartment_id, question_id, value, note, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(apartment_id, question_id)
       DO UPDATE SET value = excluded.value, note = excluded.note, updated_at = excluded.updated_at`
    ).bind(
      crypto.randomUUID(),
      answer.apartmentId,
      answer.questionId,
      answer.value,
      answer.note ?? null,
      timestamp
    )
  )

  await c.env.DB.batch(statements)
  return c.json({ ok: true, updated: answers.length })
})

app.post('/api/photos/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!isUploadFile(file)) {
    return c.json({ error: 'file is required' }, 400)
  }

  const payload = uploadPhotoSchema.parse({
    apartmentId: formData.get('apartmentId'),
    questionId: formData.get('questionId') ?? undefined
  })
  const id = crypto.randomUUID()
  const key = `${payload.apartmentId}-${Date.now()}-${id}-${file.name}`

  await c.env.PHOTOS.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream'
    }
  })

  const createdAt = nowIso()
  await c.env.DB.prepare(
    'INSERT INTO photos (id, apartment_id, question_id, r2_key, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(id, payload.apartmentId, payload.questionId ?? null, key, createdAt)
    .run()

  return c.json(
    {
      id,
      apartmentId: payload.apartmentId,
      questionId: payload.questionId ?? null,
      r2Key: key,
      createdAt
    },
    201
  )
})

app.get('/api/photos/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.PHOTOS.get(key)
  if (!object) {
    return c.json({ error: 'Photo not found' }, 404)
  }
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
})

app.delete('/api/photos/:id', async (c) => {
  const id = c.req.param('id')
  const photo = await c.env.DB.prepare('SELECT r2_key FROM photos WHERE id = ?')
    .bind(id)
    .first<{ r2_key: string }>()
  if (!photo) {
    return c.json({ error: 'Photo not found' }, 404)
  }
  await c.env.PHOTOS.delete(photo.r2_key)
  await c.env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()
  return c.body(null, 204)
})

app.get('/api/export/json', async (c) => {
  const dump: Record<string, unknown[]> = {}
  for (const tableName of exportTableNames) {
    const result = await c.env.DB.prepare(`SELECT * FROM ${tableName}`).all()
    dump[tableName] = typedRows(result)
  }
  return c.json({
    exportedAt: nowIso(),
    data: dump
  })
})

app.get('/api/export/xlsx', async (c) => {
  const apartmentRows = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, address, price, notes FROM apartments ORDER BY created_at DESC'
    ).all()
  )
  const questionRows = typedRows(
    await c.env.DB.prepare(
      'SELECT id, label FROM questions WHERE is_archived = 0 ORDER BY category_id ASC, "order" ASC'
    ).all()
  )
  const answerRows = typedRows(
    await c.env.DB.prepare(
      'SELECT apartment_id, question_id, value FROM answers'
    ).all()
  )

  const answersByApartment = new Map<string, Map<string, string | null>>()
  for (const answerRow of answerRows) {
    const apartmentId = String(answerRow.apartment_id)
    const questionId = String(answerRow.question_id)
    const apartmentAnswers =
      answersByApartment.get(apartmentId) ?? new Map<string, string | null>()
    apartmentAnswers.set(questionId, (answerRow.value as string | null) ?? null)
    answersByApartment.set(apartmentId, apartmentAnswers)
  }

  const records = apartmentRows.map((apartmentRow) => {
    const baseRecord: Record<string, string | number | null> = {
      apartmentId: String(apartmentRow.id),
      title: String(apartmentRow.title),
      address: (apartmentRow.address as string | null) ?? null,
      price: (apartmentRow.price as number | null) ?? null,
      notes: (apartmentRow.notes as string | null) ?? null
    }
    const apartmentAnswers =
      answersByApartment.get(String(apartmentRow.id)) ?? new Map()
    for (const questionRow of questionRows) {
      baseRecord[String(questionRow.label)] =
        apartmentAnswers.get(String(questionRow.id)) ?? null
    }
    return baseRecord
  })

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(records)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Apartments')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="apartments_export_${new Date().toISOString().slice(0, 10)}.xlsx"`
    }
  })
})

app.onError((err, c) => {
  console.error(err)
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation error', details: err.flatten() }, 400)
  }
  return c.json({ error: err.message }, 500)
})

export default app
