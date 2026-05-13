import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { typedRows } from '../helpers'

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

const categories = new Hono<AppEnv>()

categories.get('/', async (c) => {
  const userId = c.get('userId')
  const result = await c.env.DB.prepare(
    'SELECT id, name, "order" FROM categories WHERE user_id = ? ORDER BY "order" ASC, name ASC'
  )
    .bind(userId)
    .all()
  return c.json(typedRows(result))
})

categories.post('/', async (c) => {
  const userId = c.get('userId')
  const payload = categorySchema.parse(await c.req.json())
  const id = crypto.randomUUID()
  const order =
    payload.order ??
    ((
      await c.env.DB.prepare(
        'SELECT COALESCE(MAX("order"), 0) AS value FROM categories WHERE user_id = ?'
      )
        .bind(userId)
        .first<{ value: number }>()
    )?.value ?? 0) + 1
  await c.env.DB.prepare(
    'INSERT INTO categories (id, name, "order", user_id) VALUES (?, ?, ?, ?)'
  )
    .bind(id, payload.name, order, userId)
    .run()
  return c.json({ id, name: payload.name, order }, 201)
})

categories.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = categoryPatchSchema.parse(await c.req.json())
  const result = await c.env.DB.prepare(
    'UPDATE categories SET name = COALESCE(?, name), "order" = COALESCE(?, "order") WHERE id = ? AND user_id = ?'
  )
    .bind(payload.name ?? null, payload.order ?? null, id, userId)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Category not found' }, 404)
  }
  const updated = await c.env.DB.prepare(
    'SELECT id, name, "order" FROM categories WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first()
  return c.json(updated)
})

categories.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const linked = await c.env.DB.prepare(
    'SELECT COUNT(*) AS value FROM questions WHERE category_id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ value: number }>()
  if ((linked?.value ?? 0) > 0) {
    return c.json(
      { error: 'Cannot delete category with attached questions' },
      409
    )
  }
  const result = await c.env.DB.prepare(
    'DELETE FROM categories WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Category not found' }, 404)
  }
  return c.body(null, 204)
})

export { categories }
