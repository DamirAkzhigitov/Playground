import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { formatItemType, nowIso, slugify, typedRows } from '../helpers'
import { loadSpecTemplate } from '../spec-template'

const createItemTypeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  icon: z.string().trim().max(40).nullable().optional()
})

const updateItemTypeSchema = createItemTypeSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const itemTypes = new Hono<AppEnv>()

itemTypes.get('/', async (c) => {
  const userId = c.get('userId')
  const result = userId
    ? await c.env.DB.prepare(
        `SELECT id, slug, name, icon, is_system, user_id, "order", created_at
         FROM item_types
         WHERE is_system = 1 OR user_id = ?
         ORDER BY is_system DESC, "order" ASC, name ASC`
      )
        .bind(userId)
        .all()
    : await c.env.DB.prepare(
        `SELECT id, slug, name, icon, is_system, user_id, "order", created_at
         FROM item_types
         WHERE is_system = 1
         ORDER BY "order" ASC, name ASC`
      ).all()

  return c.json(typedRows(result).map(formatItemType))
})

itemTypes.post('/', async (c) => {
  const userId = c.get('userId')!
  const payload = createItemTypeSchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const slug = payload.slug?.trim() || slugify(payload.name)
  const createdAt = nowIso()

  const orderRow = await c.env.DB.prepare(
    'SELECT COALESCE(MAX("order"), 0) AS value FROM item_types WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ value: number }>()

  await c.env.DB.prepare(
    `INSERT INTO item_types (id, slug, name, icon, is_system, user_id, "order", created_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
  )
    .bind(
      id,
      slug,
      payload.name,
      payload.icon ?? null,
      userId,
      Number(orderRow?.value ?? 0) + 1,
      createdAt
    )
    .run()

  const sectionId = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO spec_sections (id, item_type_id, name, "order") VALUES (?, ?, ?, 1)'
  )
    .bind(sectionId, id, 'General')
    .run()

  return c.json(
    {
      id,
      slug,
      name: payload.name,
      icon: payload.icon ?? null,
      isSystem: false,
      userId,
      order: Number(orderRow?.value ?? 0) + 1,
      createdAt
    },
    201
  )
})

itemTypes.get('/:id/template', async (c) => {
  const id = c.req.param('id')
  const typeRow = await c.env.DB.prepare(
    'SELECT id FROM item_types WHERE id = ?'
  )
    .bind(id)
    .first()
  if (!typeRow) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const sections = await loadSpecTemplate(c.env.DB, id)
  return c.json(sections)
})

itemTypes.patch('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')
  const payload = updateItemTypeSchema.parse(await c.req.json())

  const row = await c.env.DB.prepare(
    'SELECT id, is_system, user_id FROM item_types WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; is_system: number; user_id: string | null }>()
  if (!row || row.is_system === 1 || row.user_id !== userId) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  if (payload.slug) {
    const clash = await c.env.DB.prepare(
      'SELECT id FROM item_types WHERE slug = ? AND id != ?'
    )
      .bind(payload.slug, id)
      .first()
    if (clash) {
      return c.json({ error: 'Slug already in use' }, 409)
    }
  }

  await c.env.DB.prepare(
    `UPDATE item_types
     SET name = COALESCE(?, name),
         slug = COALESCE(?, slug),
         icon = COALESCE(?, icon)
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      payload.name ?? null,
      payload.slug ?? null,
      payload.icon === undefined ? null : payload.icon,
      id,
      userId
    )
    .run()

  const updated = await c.env.DB.prepare(
    'SELECT id, slug, name, icon, is_system, user_id, "order", created_at FROM item_types WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()

  return c.json(formatItemType(updated ?? {}))
})

itemTypes.delete('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')

  const row = await c.env.DB.prepare(
    'SELECT id, is_system, user_id FROM item_types WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; is_system: number; user_id: string | null }>()
  if (!row || row.is_system === 1 || row.user_id !== userId) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const inUse = await c.env.DB.prepare(
    'SELECT 1 FROM items WHERE item_type_id = ? LIMIT 1'
  )
    .bind(id)
    .first()
  if (inUse) {
    return c.json({ error: 'Item type is in use by items' }, 409)
  }

  await c.env.DB.prepare('DELETE FROM item_types WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
  return c.body(null, 204)
})

export { itemTypes }
