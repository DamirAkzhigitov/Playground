import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { toSpec, typedRows } from '../helpers'

const specTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'boolean',
  'select',
  'multi-select',
  'rating'
])

const valuePreferenceSchema = z.enum(['higher', 'lower'])

const specOptionSchema = z.object({
  label: z.string().trim().min(1).max(300),
  value: z.string().trim().min(1).max(200),
  order: z.number().int().min(0)
})

const sectionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  order: z.number().int().min(0).optional()
})

const specSchema = z.object({
  label: z.string().trim().min(1).max(300),
  type: specTypeSchema,
  sectionId: z.string().trim().min(1),
  required: z.boolean(),
  order: z.number().int().min(0).optional(),
  ratingMin: z.number().int().nullable().optional(),
  ratingMax: z.number().int().nullable().optional(),
  valuePreference: valuePreferenceSchema.optional(),
  options: z.array(specOptionSchema).optional()
})

const specPatchSchema = z
  .object({
    label: z.string().trim().min(1).max(300).optional(),
    type: specTypeSchema.optional(),
    sectionId: z.string().trim().min(1).optional(),
    required: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    ratingMin: z.number().int().nullable().optional(),
    ratingMax: z.number().int().nullable().optional(),
    valuePreference: valuePreferenceSchema.optional(),
    options: z.array(specOptionSchema).optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

function valuePreferenceForCreate(
  type: z.infer<typeof specTypeSchema>,
  pref: z.infer<typeof valuePreferenceSchema> | undefined
): z.infer<typeof valuePreferenceSchema> | null {
  if (type === 'number') return pref ?? 'higher'
  if (type === 'date') return pref ?? 'lower'
  return null
}

async function assertCustomTypeOwner(
  db: D1Database,
  typeId: string,
  userId: string
): Promise<boolean> {
  const row = await db
    .prepare('SELECT is_system, user_id FROM item_types WHERE id = ?')
    .bind(typeId)
    .first<{ is_system: number; user_id: string | null }>()
  return Boolean(row && row.is_system === 0 && row.user_id === userId)
}

const typeTemplate = new Hono<AppEnv>()

typeTemplate.post('/:typeId/sections', async (c) => {
  const userId = c.get('userId')!
  const typeId = c.req.param('typeId')
  if (!(await assertCustomTypeOwner(c.env.DB, typeId, userId))) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const payload = sectionSchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const order =
    payload.order ??
    ((
      await c.env.DB.prepare(
        'SELECT COALESCE(MAX("order"), 0) AS value FROM spec_sections WHERE item_type_id = ?'
      )
        .bind(typeId)
        .first<{ value: number }>()
    )?.value ?? 0) + 1

  await c.env.DB.prepare(
    'INSERT INTO spec_sections (id, item_type_id, name, "order") VALUES (?, ?, ?, ?)'
  )
    .bind(id, typeId, payload.name, order)
    .run()

  return c.json({ id, name: payload.name, order }, 201)
})

typeTemplate.post('/:typeId/specs', async (c) => {
  const userId = c.get('userId')!
  const typeId = c.req.param('typeId')
  if (!(await assertCustomTypeOwner(c.env.DB, typeId, userId))) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const payload = specSchema.parse(await c.req.json())
  const section = await c.env.DB.prepare(
    'SELECT id FROM spec_sections WHERE id = ? AND item_type_id = ?'
  )
    .bind(payload.sectionId, typeId)
    .first()
  if (!section) {
    return c.json({ error: 'Section not found' }, 404)
  }

  const id = crypto.randomUUID()
  const order =
    payload.order ??
    ((
      await c.env.DB.prepare(
        'SELECT COALESCE(MAX("order"), 0) AS value FROM specs WHERE section_id = ?'
      )
        .bind(payload.sectionId)
        .first<{ value: number }>()
    )?.value ?? 0) + 1

  const ratingMin = payload.type === 'rating' ? (payload.ratingMin ?? 1) : null
  const ratingMax = payload.type === 'rating' ? (payload.ratingMax ?? 5) : null
  const valuePref = valuePreferenceForCreate(
    payload.type,
    payload.valuePreference
  )

  await c.env.DB.prepare(
    `INSERT INTO specs (id, item_type_id, section_id, label, type, required, is_archived, "order", rating_min, rating_max, value_preference)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`
  )
    .bind(
      id,
      typeId,
      payload.sectionId,
      payload.label,
      payload.type,
      payload.required ? 1 : 0,
      order,
      ratingMin,
      ratingMax,
      valuePref
    )
    .run()

  if (payload.options?.length) {
    const stmts = payload.options.map((opt) =>
      c.env.DB.prepare(
        'INSERT INTO spec_options (id, spec_id, label, value, "order") VALUES (?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), id, opt.label, opt.value, opt.order)
    )
    await c.env.DB.batch(stmts)
  }

  const specRow = await c.env.DB.prepare(
    'SELECT id, label, type, section_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM specs WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()
  const options = typedRows(
    await c.env.DB.prepare(
      'SELECT id, spec_id, label, value, "order" FROM spec_options WHERE spec_id = ? ORDER BY "order" ASC'
    )
      .bind(id)
      .all()
  )

  return c.json(toSpec(specRow ?? {}, options), 201)
})

typeTemplate.patch('/:typeId/specs/:specId', async (c) => {
  const userId = c.get('userId')!
  const typeId = c.req.param('typeId')
  const specId = c.req.param('specId')
  if (!(await assertCustomTypeOwner(c.env.DB, typeId, userId))) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const payload = specPatchSchema.parse(await c.req.json())
  const existing = await c.env.DB.prepare(
    'SELECT id FROM specs WHERE id = ? AND item_type_id = ?'
  )
    .bind(specId, typeId)
    .first()
  if (!existing) {
    return c.json({ error: 'Spec not found' }, 404)
  }

  if (payload.sectionId) {
    const section = await c.env.DB.prepare(
      'SELECT id FROM spec_sections WHERE id = ? AND item_type_id = ?'
    )
      .bind(payload.sectionId, typeId)
      .first()
    if (!section) {
      return c.json({ error: 'Section not found' }, 404)
    }
  }

  await c.env.DB.prepare(
    `UPDATE specs
     SET label = COALESCE(?, label),
         type = COALESCE(?, type),
         section_id = COALESCE(?, section_id),
         required = COALESCE(?, required),
         is_archived = COALESCE(?, is_archived),
         "order" = COALESCE(?, "order"),
         rating_min = COALESCE(?, rating_min),
         rating_max = COALESCE(?, rating_max),
         value_preference = COALESCE(?, value_preference)
     WHERE id = ? AND item_type_id = ?`
  )
    .bind(
      payload.label ?? null,
      payload.type ?? null,
      payload.sectionId ?? null,
      payload.required === undefined ? null : payload.required ? 1 : 0,
      payload.isArchived === undefined ? null : payload.isArchived ? 1 : 0,
      payload.order ?? null,
      payload.ratingMin ?? null,
      payload.ratingMax ?? null,
      payload.valuePreference ?? null,
      specId,
      typeId
    )
    .run()

  if (payload.options) {
    await c.env.DB.prepare('DELETE FROM spec_options WHERE spec_id = ?')
      .bind(specId)
      .run()
    if (payload.options.length > 0) {
      const stmts = payload.options.map((opt) =>
        c.env.DB.prepare(
          'INSERT INTO spec_options (id, spec_id, label, value, "order") VALUES (?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), specId, opt.label, opt.value, opt.order)
      )
      await c.env.DB.batch(stmts)
    }
  }

  const specRow = await c.env.DB.prepare(
    'SELECT id, label, type, section_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM specs WHERE id = ?'
  )
    .bind(specId)
    .first<Record<string, unknown>>()
  const options = typedRows(
    await c.env.DB.prepare(
      'SELECT id, spec_id, label, value, "order" FROM spec_options WHERE spec_id = ? ORDER BY "order" ASC'
    )
      .bind(specId)
      .all()
  )
  return c.json(toSpec(specRow ?? {}, options))
})

export { typeTemplate }
