import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { entityIdSchema } from '../schemas'
import { requireAuth } from '../middleware'
import {
  typedRows,
  formatAction,
  formatStep,
  formatRequirement,
  nowIso,
  ActionRow,
  StepRow,
  RequirementRow
} from '../helpers'

const contributorActions = new Hono<AppEnv>()

// All contributor routes require auth + role check
contributorActions.use('*', requireAuth)

async function ensureContributor(c: Context<AppEnv>) {
  const userId = c.get('userId')
  const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
    .bind(userId)
    .first<{ role: string }>()
  if (!user || (user.role !== 'contributor' && user.role !== 'admin')) {
    return c.json({ error: 'Contributor access required' }, 403)
  }
  return null
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().max(500).optional(),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(10)
    .optional()
    .default([]),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/i)
    .max(80)
    .optional()
})

const patchMetaSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    summary: z.string().trim().max(500).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/i)
      .max(80)
      .optional()
  })
  .refine((p) => Object.keys(p).length > 0, {
    message: 'At least one field required'
  })

const stepInputSchema = z.object({
  id: entityIdSchema.optional(),
  order: z.number().int().min(1),
  title: z.string().trim().min(1).max(200),
  bodyMd: z.string().max(20000).optional().nullable(),
  estimatedMinutes: z.number().int().min(1).max(600).optional().nullable(),
  requirements: z
    .array(
      z.object({
        id: entityIdSchema.optional(),
        label: z.string().trim().min(1).max(200),
        kind: z.enum(['document', 'task', 'link']).default('task'),
        details: z.string().max(500).optional().nullable(),
        order: z.number().int().min(0).default(0)
      })
    )
    .max(20)
    .optional()
    .default([])
})

const replaceStepsSchema = z.object({
  steps: z.array(stepInputSchema).min(1).max(50)
})

// GET /api/contributor/actions  (my drafts + published)
contributorActions.get('/', async (c) => {
  const guard = await ensureContributor(c)
  if (guard) return guard

  const userId = c.get('userId')
  const res = await c.env.DB.prepare(
    `SELECT id, slug, title, summary, tags_json, status, locale, author_id, created_at, updated_at
     FROM actions WHERE author_id = ? ORDER BY updated_at DESC`
  )
    .bind(userId)
    .all<ActionRow>()

  return c.json({ items: typedRows(res).map(formatAction) })
})

// POST /api/contributor/actions  create draft
contributorActions.post('/', async (c) => {
  const guard = await ensureContributor(c)
  if (guard) return guard

  const userId = c.get('userId')
  const payload = createSchema.parse(await c.req.json())
  const now = nowIso()

  let slug = payload.slug || slugify(payload.title)
  // Ensure unique slug
  let attempt = 0
  while (true) {
    const exists = await c.env.DB.prepare(
      'SELECT 1 FROM actions WHERE slug = ?'
    )
      .bind(slug)
      .first()
    if (!exists) break
    attempt++
    slug = `${slugify(payload.title)}-${attempt}`
    if (attempt > 20)
      return c.json({ error: 'Unable to generate unique slug' }, 400)
  }

  const id = crypto.randomUUID()
  const tagsJson = JSON.stringify(payload.tags || [])

  await c.env.DB.prepare(
    `INSERT INTO actions (id, slug, title, summary, tags_json, status, locale, author_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'draft', 'en', ?, ?, ?)`
  )
    .bind(
      id,
      slug,
      payload.title,
      payload.summary ?? null,
      tagsJson,
      userId,
      now,
      now
    )
    .run()

  const created = await c.env.DB.prepare('SELECT * FROM actions WHERE id = ?')
    .bind(id)
    .first<ActionRow>()

  return c.json({ action: formatAction(created!) }, 201)
})

// PATCH /api/contributor/actions/:id  (metadata only; steps via PUT)
contributorActions.patch('/:id', async (c) => {
  const guard = await ensureContributor(c)
  if (guard) return guard

  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = patchMetaSchema.parse(await c.req.json())

  // Verify ownership (admin can too? for now owner or admin)
  const existing = await c.env.DB.prepare(
    'SELECT id, author_id, status FROM actions WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; author_id: string | null; status: string }>()
  if (!existing) return c.json({ error: 'Action not found' }, 404)

  const isOwner = existing.author_id === userId
  const isAdmin =
    (
      await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
        .bind(userId)
        .first<{ role: string }>()
    )?.role === 'admin'
  if (!isOwner && !isAdmin) return c.json({ error: 'Forbidden' }, 403)

  // If changing slug, ensure unique
  if (payload.slug) {
    const conflict = await c.env.DB.prepare(
      'SELECT id FROM actions WHERE slug = ? AND id != ?'
    )
      .bind(payload.slug, id)
      .first()
    if (conflict) return c.json({ error: 'Slug already in use' }, 409)
  }

  const tagsJson =
    payload.tags !== undefined ? JSON.stringify(payload.tags) : null

  const result = await c.env.DB.prepare(
    `UPDATE actions SET
      title = COALESCE(?, title),
      summary = COALESCE(?, summary),
      tags_json = COALESCE(?, tags_json),
      slug = COALESCE(?, slug),
      updated_at = ?
     WHERE id = ?`
  )
    .bind(
      payload.title ?? null,
      payload.summary ?? null,
      tagsJson,
      payload.slug ?? null,
      nowIso(),
      id
    )
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'No changes' }, 400)
  }

  const updated = await c.env.DB.prepare('SELECT * FROM actions WHERE id = ?')
    .bind(id)
    .first<ActionRow>()
  return c.json({ action: formatAction(updated!) })
})

// PUT /api/contributor/actions/:id/steps  full replace (for create/edit/reorder)
contributorActions.put('/:id/steps', async (c) => {
  const guard = await ensureContributor(c)
  if (guard) return guard

  const userId = c.get('userId')
  const id = c.req.param('id')
  const { steps } = replaceStepsSchema.parse(await c.req.json())

  const existing = await c.env.DB.prepare(
    'SELECT id, author_id FROM actions WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; author_id: string | null }>()
  if (!existing) return c.json({ error: 'Action not found' }, 404)

  const isOwner = existing.author_id === userId
  const isAdmin =
    (
      await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
        .bind(userId)
        .first<{ role: string }>()
    )?.role === 'admin'
  if (!isOwner && !isAdmin) return c.json({ error: 'Forbidden' }, 403)

  const now = nowIso()

  // Use transaction? D1 supports via batch? For simplicity, sequential + cleanup.
  // Delete old steps/reqs (CASCADE will handle reqs? No, we delete steps, FK cascade on reqs)
  await c.env.DB.prepare('DELETE FROM steps WHERE action_id = ?').bind(id).run()

  for (const s of steps) {
    const stepId = s.id || crypto.randomUUID()
    await c.env.DB.prepare(
      `INSERT INTO steps (id, action_id, "order", title, body_md, estimated_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        stepId,
        id,
        s.order,
        s.title,
        s.bodyMd ?? null,
        s.estimatedMinutes ?? null,
        now,
        now
      )
      .run()

    if (s.requirements && s.requirements.length > 0) {
      for (const r of s.requirements) {
        const reqId = r.id || crypto.randomUUID()
        await c.env.DB.prepare(
          `INSERT INTO step_requirements (id, step_id, label, kind, details, "order")
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(reqId, stepId, r.label, r.kind, r.details ?? null, r.order)
          .run()
      }
    }
  }

  await c.env.DB.prepare('UPDATE actions SET updated_at = ? WHERE id = ?')
    .bind(now, id)
    .run()

  // Return the new structure for preview
  const freshSteps = await c.env.DB.prepare(
    'SELECT * FROM steps WHERE action_id = ? ORDER BY "order"'
  )
    .bind(id)
    .all<StepRow>()
  const stepIds = typedRows(freshSteps).map((s) => s.id)
  let reqs: RequirementRow[] = []
  if (stepIds.length) {
    const ph = stepIds.map(() => '?').join(',')
    const rres = await c.env.DB.prepare(
      `SELECT * FROM step_requirements WHERE step_id IN (${ph}) ORDER BY step_id, "order"`
    )
      .bind(...stepIds)
      .all<RequirementRow>()
    reqs = typedRows(rres)
  }

  return c.json({
    steps: typedRows(freshSteps).map(formatStep),
    requirements: reqs.map(formatRequirement)
  })
})

// POST /api/contributor/actions/:id/publish
contributorActions.post('/:id/publish', async (c) => {
  const guard = await ensureContributor(c)
  if (guard) return guard

  const userId = c.get('userId')
  const id = c.req.param('id')

  const action = await c.env.DB.prepare(
    'SELECT id, author_id, status FROM actions WHERE id = ?'
  )
    .bind(id)
    .first<{ id: string; author_id: string | null; status: string }>()
  if (!action) return c.json({ error: 'Action not found' }, 404)

  const isOwner = action.author_id === userId
  const isAdmin =
    (
      await c.env.DB.prepare('SELECT role FROM users WHERE id = ?')
        .bind(userId)
        .first<{ role: string }>()
    )?.role === 'admin'
  if (!isOwner && !isAdmin) return c.json({ error: 'Forbidden' }, 403)

  if (action.status === 'published') {
    return c.json({ message: 'Already published' })
  }

  // Minimal validation: at least one step
  const stepCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM steps WHERE action_id = ?'
  )
    .bind(id)
    .first<{ cnt: number }>()

  if ((stepCount?.cnt ?? 0) < 1) {
    return c.json({ error: 'Cannot publish: add at least one step' }, 400)
  }

  const now = nowIso()
  await c.env.DB.prepare(
    "UPDATE actions SET status = 'published', updated_at = ? WHERE id = ?"
  )
    .bind(now, id)
    .run()

  const updated = await c.env.DB.prepare('SELECT * FROM actions WHERE id = ?')
    .bind(id)
    .first<ActionRow>()
  return c.json({ action: formatAction(updated!) })
})

export { contributorActions }
