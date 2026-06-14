import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { formatItem, nowIso, typedRows } from '../helpers'
import { canReadItem, canWriteItem, fetchItemRow } from '../item-access'
import { loadSpecTemplate } from '../spec-template'

const itemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  itemTypeId: z.string().trim().min(1),
  notes: z.string().trim().max(5000).nullable().optional(),
  isPublic: z.boolean().optional()
})

const itemPatchSchema = itemSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const items = new Hono<AppEnv>()

async function itemCompletion(
  db: D1Database,
  itemId: string,
  itemTypeId: string
): Promise<{
  answeredSpecs: number
  totalSpecs: number
  percent: number
  criticalMissingCount: number
}> {
  const totalRow = await db
    .prepare(
      'SELECT COUNT(*) AS count FROM specs WHERE item_type_id = ? AND is_archived = 0'
    )
    .bind(itemTypeId)
    .first<{ count: number }>()

  const answeredRow = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM specs s
       INNER JOIN answers a ON a.spec_id = s.id AND a.item_id = ?
       WHERE s.item_type_id = ? AND s.is_archived = 0
         AND a.value IS NOT NULL
         AND TRIM(a.value) != ''
         AND TRIM(a.value) != '[]'
         AND (
           s.type != 'multi-select'
           OR (
             json_valid(TRIM(a.value)) = 1
             AND json_type(TRIM(a.value)) = 'array'
             AND json_array_length(TRIM(a.value)) > 0
           )
         )`
    )
    .bind(itemId, itemTypeId)
    .first<{ count: number }>()

  const criticalRow = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM specs s
       LEFT JOIN answers a ON a.spec_id = s.id AND a.item_id = ?
       WHERE s.item_type_id = ? AND s.is_archived = 0 AND s.required = 1
         AND NOT (
           a.id IS NOT NULL
           AND a.value IS NOT NULL
           AND TRIM(a.value) != ''
           AND TRIM(a.value) != '[]'
           AND (
             s.type != 'multi-select'
             OR (
               json_valid(TRIM(a.value)) = 1
               AND json_type(TRIM(a.value)) = 'array'
               AND json_array_length(TRIM(a.value)) > 0
             )
           )
         )`
    )
    .bind(itemId, itemTypeId)
    .first<{ count: number }>()

  const total = Number(totalRow?.count ?? 0)
  const answered = Number(answeredRow?.count ?? 0)
  const criticalMissing = Number(criticalRow?.count ?? 0)
  return {
    answeredSpecs: answered,
    totalSpecs: total,
    percent: total > 0 ? Math.round((answered / total) * 100) : 0,
    criticalMissingCount: criticalMissing
  }
}

items.get('/', async (c) => {
  const userId = c.get('userId')!
  const typeFilter = c.req.query('itemTypeId')

  const sql = typeFilter
    ? `SELECT id, item_type_id, title, notes, is_public, user_id, created_at, updated_at
       FROM items
       WHERE (user_id = ? OR is_public = 1) AND item_type_id = ?
       ORDER BY created_at DESC`
    : `SELECT id, item_type_id, title, notes, is_public, user_id, created_at, updated_at
       FROM items
       WHERE user_id = ? OR is_public = 1
       ORDER BY created_at DESC`

  const result = typeFilter
    ? await c.env.DB.prepare(sql).bind(userId, typeFilter).all()
    : await c.env.DB.prepare(sql).bind(userId).all()

  const list = await Promise.all(
    typedRows(result).map(async (row) => {
      const completion = await itemCompletion(
        c.env.DB,
        String(row.id),
        String(row.item_type_id)
      )
      return {
        ...formatItem(row),
        isOwner: String(row.user_id) === userId,
        completion
      }
    })
  )
  return c.json(list)
})

items.post('/', async (c) => {
  const userId = c.get('userId')!
  const payload = itemSchema.parse(await c.req.json())

  const typeExists = await c.env.DB.prepare(
    'SELECT id FROM item_types WHERE id = ? AND (is_system = 1 OR user_id = ?)'
  )
    .bind(payload.itemTypeId, userId)
    .first()
  if (!typeExists) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const isPublic = payload.isPublic ? 1 : 0
  const id = crypto.randomUUID()
  const timestamp = nowIso()
  await c.env.DB.prepare(
    `INSERT INTO items (id, item_type_id, user_id, title, notes, is_public, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.itemTypeId,
      userId,
      payload.title,
      payload.notes ?? null,
      isPublic,
      timestamp,
      timestamp
    )
    .run()

  return c.json(
    {
      id,
      itemTypeId: payload.itemTypeId,
      title: payload.title,
      notes: payload.notes ?? null,
      isPublic: isPublic === 1,
      isOwner: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    201
  )
})

items.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const accessRow = await fetchItemRow(c.env.DB, id)
  if (!accessRow || !canReadItem(accessRow, userId)) {
    return c.json({ error: 'Item not found' }, 404)
  }

  const isOwner = Boolean(userId && accessRow.user_id === userId)
  const item = await c.env.DB.prepare(
    'SELECT id, item_type_id, title, notes, is_public, created_at, updated_at FROM items WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()
  if (!item) {
    return c.json({ error: 'Item not found' }, 404)
  }

  const answersResult = await c.env.DB.prepare(
    'SELECT id, item_id, spec_id, value, note, updated_at FROM answers WHERE item_id = ? ORDER BY updated_at DESC'
  )
    .bind(id)
    .all()
  const photosResult = await c.env.DB.prepare(
    'SELECT id, item_id, spec_id, r2_key, created_at FROM photos WHERE item_id = ? ORDER BY created_at DESC'
  )
    .bind(id)
    .all()

  const sections = await loadSpecTemplate(c.env.DB, String(item.item_type_id))

  return c.json({
    ...formatItem(item),
    isOwner,
    sections,
    answers: typedRows(answersResult).map((row) => ({
      id: row.id,
      itemId: row.item_id,
      specId: row.spec_id,
      value: row.value,
      note: row.note,
      updatedAt: row.updated_at
    })),
    photos: typedRows(photosResult).map((row) => ({
      id: row.id,
      itemId: row.item_id,
      specId: row.spec_id,
      r2Key: row.r2_key,
      createdAt: row.created_at
    }))
  })
})

items.patch('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')
  const payload = itemPatchSchema.parse(await c.req.json())
  const row = await fetchItemRow(c.env.DB, id)
  if (!row || !canWriteItem(row, userId)) {
    return c.json({ error: 'Item not found' }, 404)
  }

  if (payload.itemTypeId) {
    const typeExists = await c.env.DB.prepare(
      'SELECT id FROM item_types WHERE id = ? AND (is_system = 1 OR user_id = ?)'
    )
      .bind(payload.itemTypeId, userId)
      .first()
    if (!typeExists) {
      return c.json({ error: 'Item type not found' }, 404)
    }
  }

  const timestamp = nowIso()
  const isPublic =
    payload.isPublic === undefined ? null : payload.isPublic ? 1 : 0
  const result = await c.env.DB.prepare(
    `UPDATE items
     SET title = COALESCE(?, title),
         item_type_id = COALESCE(?, item_type_id),
         notes = COALESCE(?, notes),
         is_public = COALESCE(?, is_public),
         updated_at = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      payload.title ?? null,
      payload.itemTypeId ?? null,
      payload.notes ?? null,
      isPublic,
      timestamp,
      id,
      userId
    )
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Item not found' }, 404)
  }

  const item = await c.env.DB.prepare(
    'SELECT id, item_type_id, title, notes, is_public, created_at, updated_at FROM items WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()
  return c.json({ ...formatItem(item ?? {}), isOwner: true })
})

items.delete('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')
  const row = await fetchItemRow(c.env.DB, id)
  if (!row || !canWriteItem(row, userId)) {
    return c.json({ error: 'Item not found' }, 404)
  }

  const photos = await c.env.DB.prepare(
    'SELECT p.r2_key FROM photos p WHERE p.item_id = ?'
  )
    .bind(id)
    .all<{ r2_key: string }>()
  await Promise.all(
    typedRows(photos).map((photo) => c.env.PHOTOS.delete(photo.r2_key))
  )
  await c.env.DB.prepare('DELETE FROM items WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run()
  return c.body(null, 204)
})

export { items }
