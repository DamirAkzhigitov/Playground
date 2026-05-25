import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import {
  typedRows,
  formatAction,
  formatStep,
  formatRequirement,
  ActionRow,
  StepRow,
  RequirementRow
} from '../helpers'

const listQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(50).optional(), // single for MVP; client can repeat if needed later
  sort: z.enum(['recent', 'title', 'a-z', 'z-a']).optional().default('recent'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
})

const actions = new Hono<AppEnv>()

// Public: list published actions (search, filter, paginate)
actions.get('/', async (c) => {
  const query = listQuerySchema.parse({
    q: c.req.query('q'),
    tag: c.req.query('tag'),
    sort: c.req.query('sort'),
    page: c.req.query('page'),
    limit: c.req.query('limit')
  })

  const { q, tag, sort, page, limit } = query
  const offset = (page - 1) * limit

  let where = "status = 'published'"
  const binds: (string | number)[] = []

  if (q) {
    const like = `%${q.toLowerCase()}%`
    where +=
      ' AND (LOWER(title) LIKE ? OR LOWER(summary) LIKE ? OR LOWER(tags_json) LIKE ?)'
    binds.push(like, like, like)
  }
  if (tag) {
    // Simple contains for JSON array string (MVP). For robustness could parse in app later.
    const tagLike = `%"${tag}"%`
    where += ' AND tags_json LIKE ?'
    binds.push(tagLike)
  }

  let orderBy = 'updated_at DESC'
  if (sort === 'title' || sort === 'a-z') orderBy = 'title ASC'
  if (sort === 'z-a') orderBy = 'title DESC'

  const countSql = `SELECT COUNT(*) as total FROM actions WHERE ${where}`
  const countRow = await c.env.DB.prepare(countSql)
    .bind(...binds)
    .first<{ total: number }>()
  const total = countRow?.total ?? 0

  const sql = `
    SELECT id, slug, title, summary, tags_json, status, locale, author_id, created_at, updated_at
    FROM actions
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `
  const rows = await c.env.DB.prepare(sql)
    .bind(...binds, limit, offset)
    .all<ActionRow>()

  return c.json({
    items: typedRows(rows).map(formatAction),
    total,
    page,
    limit,
    hasMore: offset + limit < total
  })
})

// Public: get one published action + steps + requirements (for browse mode)
actions.get('/:slug', async (c) => {
  const slug = c.req.param('slug')

  const actionRow = await c.env.DB.prepare(
    `SELECT id, slug, title, summary, tags_json, status, locale, author_id, created_at, updated_at
     FROM actions WHERE slug = ? AND status = 'published'`
  )
    .bind(slug)
    .first<ActionRow>()

  if (!actionRow) {
    return c.json({ error: 'Action not found' }, 404)
  }

  const stepsRes = await c.env.DB.prepare(
    `SELECT id, action_id, "order", title, body_md, estimated_minutes, created_at, updated_at
     FROM steps WHERE action_id = ? ORDER BY "order" ASC`
  )
    .bind(actionRow.id)
    .all<StepRow>()

  const steps = typedRows(stepsRes).map(formatStep)

  const stepIds = steps.map((s) => s.id)
  let requirements: ReturnType<typeof formatRequirement>[] = []
  if (stepIds.length > 0) {
    // IN clause with placeholders
    const placeholders = stepIds.map(() => '?').join(',')
    const reqRes = await c.env.DB.prepare(
      `SELECT id, step_id, label, kind, details, "order" FROM step_requirements
       WHERE step_id IN (${placeholders}) ORDER BY step_id, "order" ASC`
    )
      .bind(...stepIds)
      .all<RequirementRow>()
    requirements = typedRows(reqRes).map(formatRequirement)
  }

  return c.json({
    action: formatAction(actionRow),
    steps,
    requirements
  })
})

export { actions }
