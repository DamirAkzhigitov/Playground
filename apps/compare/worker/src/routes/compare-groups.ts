import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import {
  formatCompareGroup,
  formatItem,
  formatItemType,
  nowIso,
  typedRows
} from '../helpers'
import {
  canReadCompareGroup,
  canWriteCompareGroup,
  fetchCompareGroupRow
} from '../compare-group-access'
import { canReadItem } from '../item-access'
import { loadSpecTemplate } from '../spec-template'

const groupSchema = z.object({
  title: z.string().trim().min(1).max(200),
  itemTypeId: z.string().trim().min(1),
  isPublic: z.boolean().optional(),
  selectionMode: z.enum(['all', 'curated']).optional()
})

const groupPatchSchema = groupSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const groupItemsSchema = z.object({
  itemIds: z.array(z.string().trim().min(1)).max(100)
})

const compareGroups = new Hono<AppEnv>()

async function resolveGroupItems(
  db: D1Database,
  group: {
    id: string
    item_type_id: string
    selection_mode: string
    user_id: string
  },
  viewerId?: string
): Promise<Record<string, unknown>[]> {
  let rows: Record<string, unknown>[]

  if (group.selection_mode === 'curated') {
    const result = await db
      .prepare(
        `SELECT i.id, i.item_type_id, i.title, i.notes, i.is_public, i.user_id, i.created_at, i.updated_at
         FROM items i
         INNER JOIN compare_group_items cgi ON cgi.item_id = i.id
         WHERE cgi.group_id = ?
         ORDER BY i.title ASC`
      )
      .bind(group.id)
      .all()
    rows = typedRows(result)
  } else {
    const result = viewerId
      ? await db
          .prepare(
            `SELECT id, item_type_id, title, notes, is_public, user_id, created_at, updated_at
             FROM items
             WHERE item_type_id = ? AND (is_public = 1 OR user_id = ?)
             ORDER BY title ASC`
          )
          .bind(group.item_type_id, viewerId)
          .all()
      : await db
          .prepare(
            `SELECT id, item_type_id, title, notes, is_public, user_id, created_at, updated_at
             FROM items
             WHERE item_type_id = ? AND is_public = 1
             ORDER BY title ASC`
          )
          .bind(group.item_type_id)
          .all()
    rows = typedRows(result)
  }

  return rows.filter((row) =>
    canReadItem(
      {
        id: String(row.id),
        user_id: String(row.user_id),
        is_public: Number(row.is_public)
      },
      viewerId
    )
  )
}

compareGroups.get('/public', async (c) => {
  const result = await c.env.DB.prepare(
    `SELECT g.id, g.title, g.item_type_id, g.is_public, g.selection_mode, g.created_at, g.updated_at,
            t.name AS type_name, t.slug AS type_slug
     FROM compare_groups g
     INNER JOIN item_types t ON t.id = g.item_type_id
     WHERE g.is_public = 1
     ORDER BY g.created_at DESC`
  ).all()

  const list = await Promise.all(
    typedRows(result).map(async (row) => {
      const items = await resolveGroupItems(
        c.env.DB,
        {
          id: String(row.id),
          item_type_id: String(row.item_type_id),
          selection_mode: String(row.selection_mode),
          user_id: 'system'
        },
        undefined
      )
      return {
        ...formatCompareGroup(row),
        itemTypeName: row.type_name,
        itemTypeSlug: row.type_slug,
        itemCount: items.length
      }
    })
  )
  return c.json(list)
})

compareGroups.get('/', async (c) => {
  const userId = c.get('userId')!
  const result = await c.env.DB.prepare(
    `SELECT id, title, item_type_id, is_public, selection_mode, created_at, updated_at
     FROM compare_groups
     WHERE user_id = ? AND is_public = 0
     ORDER BY updated_at DESC`
  )
    .bind(userId)
    .all()

  return c.json(typedRows(result).map(formatCompareGroup))
})

compareGroups.post('/', async (c) => {
  const userId = c.get('userId')!
  const payload = groupSchema.parse(await c.req.json())

  const typeExists = await c.env.DB.prepare(
    'SELECT id FROM item_types WHERE id = ? AND (is_system = 1 OR user_id = ?)'
  )
    .bind(payload.itemTypeId, userId)
    .first()
  if (!typeExists) {
    return c.json({ error: 'Item type not found' }, 404)
  }

  const id = crypto.randomUUID()
  const timestamp = nowIso()
  const isPublic = payload.isPublic ? 1 : 0
  const selectionMode = payload.selectionMode ?? 'curated'

  await c.env.DB.prepare(
    `INSERT INTO compare_groups (id, title, item_type_id, user_id, is_public, selection_mode, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.title,
      payload.itemTypeId,
      userId,
      isPublic,
      selectionMode,
      timestamp,
      timestamp
    )
    .run()

  return c.json(
    {
      id,
      title: payload.title,
      itemTypeId: payload.itemTypeId,
      isPublic: isPublic === 1,
      selectionMode,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    201
  )
})

compareGroups.get('/:id/view', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const accessRow = await fetchCompareGroupRow(c.env.DB, id)
  if (!accessRow || !canReadCompareGroup(accessRow, userId)) {
    return c.json({ error: 'Compare group not found' }, 404)
  }

  const group = await c.env.DB.prepare(
    `SELECT id, title, item_type_id, user_id, is_public, selection_mode, created_at, updated_at
     FROM compare_groups WHERE id = ?`
  )
    .bind(id)
    .first<Record<string, unknown>>()
  if (!group) {
    return c.json({ error: 'Compare group not found' }, 404)
  }

  const itemType = await c.env.DB.prepare(
    'SELECT id, slug, name, icon, is_system, user_id, "order", created_at FROM item_types WHERE id = ?'
  )
    .bind(group.item_type_id)
    .first<Record<string, unknown>>()

  const itemRows = await resolveGroupItems(
    c.env.DB,
    {
      id: String(group.id),
      item_type_id: String(group.item_type_id),
      selection_mode: String(group.selection_mode),
      user_id: String(group.user_id)
    },
    userId
  )

  const sections = await loadSpecTemplate(c.env.DB, String(group.item_type_id))

  const itemsWithAnswers = await Promise.all(
    itemRows.map(async (row) => {
      const answersResult = await c.env.DB.prepare(
        'SELECT id, item_id, spec_id, value, note, updated_at FROM answers WHERE item_id = ?'
      )
        .bind(row.id)
        .all()
      return {
        ...formatItem(row),
        isOwner: Boolean(userId && String(row.user_id) === userId),
        answers: typedRows(answersResult).map((a) => ({
          id: a.id,
          itemId: a.item_id,
          specId: a.spec_id,
          value: a.value,
          note: a.note,
          updatedAt: a.updated_at
        }))
      }
    })
  )

  return c.json({
    group: {
      ...formatCompareGroup(group),
      isOwner: Boolean(userId && String(group.user_id) === userId)
    },
    itemType: formatItemType(itemType ?? {}),
    sections,
    items: itemsWithAnswers
  })
})

compareGroups.patch('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')
  const payload = groupPatchSchema.parse(await c.req.json())
  const row = await fetchCompareGroupRow(c.env.DB, id)
  if (!row || !canWriteCompareGroup(row, userId)) {
    return c.json({ error: 'Compare group not found' }, 404)
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

  await c.env.DB.prepare(
    `UPDATE compare_groups
     SET title = COALESCE(?, title),
         item_type_id = COALESCE(?, item_type_id),
         is_public = COALESCE(?, is_public),
         selection_mode = COALESCE(?, selection_mode),
         updated_at = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      payload.title ?? null,
      payload.itemTypeId ?? null,
      isPublic,
      payload.selectionMode ?? null,
      timestamp,
      id,
      userId
    )
    .run()

  const updated = await c.env.DB.prepare(
    'SELECT id, title, item_type_id, is_public, selection_mode, created_at, updated_at FROM compare_groups WHERE id = ?'
  )
    .bind(id)
    .first<Record<string, unknown>>()
  return c.json(formatCompareGroup(updated ?? {}))
})

compareGroups.put('/:id/items', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')
  const payload = groupItemsSchema.parse(await c.req.json())
  const row = await fetchCompareGroupRow(c.env.DB, id)
  if (!row || !canWriteCompareGroup(row, userId)) {
    return c.json({ error: 'Compare group not found' }, 404)
  }

  const group = await c.env.DB.prepare(
    'SELECT item_type_id FROM compare_groups WHERE id = ?'
  )
    .bind(id)
    .first<{ item_type_id: string }>()
  if (!group) {
    return c.json({ error: 'Compare group not found' }, 404)
  }

  for (const itemId of payload.itemIds) {
    const item = await c.env.DB.prepare(
      'SELECT id, user_id, item_type_id, is_public FROM items WHERE id = ?'
    )
      .bind(itemId)
      .first<{
        id: string
        user_id: string
        item_type_id: string
        is_public: number
      }>()
    if (
      !item ||
      item.item_type_id !== group.item_type_id ||
      item.user_id !== userId
    ) {
      return c.json({ error: `Item not found: ${itemId}` }, 404)
    }
  }

  await c.env.DB.prepare('DELETE FROM compare_group_items WHERE group_id = ?')
    .bind(id)
    .run()

  if (payload.itemIds.length > 0) {
    const stmts = payload.itemIds.map((itemId) =>
      c.env.DB.prepare(
        'INSERT INTO compare_group_items (group_id, item_id) VALUES (?, ?)'
      ).bind(id, itemId)
    )
    await c.env.DB.batch(stmts)
  }

  await c.env.DB.prepare(
    'UPDATE compare_groups SET selection_mode = ?, updated_at = ? WHERE id = ?'
  )
    .bind('curated', nowIso(), id)
    .run()

  return c.json({ ok: true, itemIds: payload.itemIds })
})

compareGroups.delete('/:id', async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')
  const row = await fetchCompareGroupRow(c.env.DB, id)
  if (!row || !canWriteCompareGroup(row, userId)) {
    return c.json({ error: 'Compare group not found' }, 404)
  }

  await c.env.DB.prepare(
    'DELETE FROM compare_groups WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .run()
  return c.body(null, 204)
})

export { compareGroups }
