import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { entityIdSchema } from '../schemas'
import { requireAuth } from '../middleware'
import {
  typedRows,
  formatEnrollment,
  formatProgress,
  nowIso,
  EnrollmentRow,
  ProgressRow,
  StepRow
} from '../helpers'

const createEnrollmentSchema = z.object({
  actionId: entityIdSchema
})

const progressPatchSchema = z
  .object({
    stepId: entityIdSchema,
    status: z.enum(['pending', 'done', 'skipped']).optional(),
    note: z.string().max(2000).nullable().optional()
  })
  .refine((p) => p.status !== undefined || p.note !== undefined, {
    message: 'Provide status or note (or both)'
  })

const enrollments = new Hono<AppEnv>()

enrollments.use('*', requireAuth)

// POST /api/enrollments { actionId } -> creates or returns existing? Per Q12: resume if in-progress, but allow multiple (Q11)
enrollments.post('/', async (c) => {
  const userId = c.get('userId')
  const { actionId } = createEnrollmentSchema.parse(await c.req.json())

  // Verify action exists (allow draft? for now only published or owned, but simple: exists)
  const action = await c.env.DB.prepare('SELECT id FROM actions WHERE id = ?')
    .bind(actionId)
    .first()
  if (!action) return c.json({ error: 'Action not found' }, 404)

  const id = crypto.randomUUID()
  const now = nowIso()

  await c.env.DB.prepare(
    `INSERT INTO enrollments (id, user_id, action_id, started_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, userId, actionId, now, now)
    .run()

  const row = await c.env.DB.prepare(
    'SELECT id, user_id, action_id, started_at, last_step_id, updated_at FROM enrollments WHERE id = ?'
  )
    .bind(id)
    .first<EnrollmentRow>()

  return c.json({ enrollment: formatEnrollment(row!) }, 201)
})

// GET /api/enrollments?status=... (in-progress | completed | all)
enrollments.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status') // 'in-progress' | 'completed' | undefined

  let sql = `
    SELECT e.id, e.user_id, e.action_id, e.started_at, e.last_step_id, e.updated_at,
           a.title as action_title, a.slug as action_slug
    FROM enrollments e
    JOIN actions a ON a.id = e.action_id
    WHERE e.user_id = ?
  `
  const binds: unknown[] = [userId]

  if (status === 'in-progress') {
    // heuristic: has any non-done progress or no progress rows yet, or updated recently
    // For MVP simplicity: client can filter; or count done vs total steps
    // Return all and let client decide; add filter later if needed.
  } else if (status === 'completed') {
    // Similar, skip for now.
  }

  sql += ' ORDER BY e.started_at DESC'

  const rows = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all<EnrollmentRow & { action_title: string; action_slug: string }>()

  // Enrich with progress summary count for convenience
  const enrollIds = typedRows(rows).map((r) => r.id)
  let progressSummary: Record<
    string,
    { done: number; total: number; skipped: number }
  > = {}
  if (enrollIds.length > 0) {
    const ph = enrollIds.map(() => '?').join(',')
    const prog = await c.env.DB.prepare(
      `SELECT enrollment_id, status, COUNT(*) as cnt FROM step_progress
       WHERE enrollment_id IN (${ph}) GROUP BY enrollment_id, status`
    )
      .bind(...enrollIds)
      .all<{ enrollment_id: string; status: string; cnt: number }>()

    progressSummary = {}
    for (const p of typedRows(prog)) {
      if (!progressSummary[p.enrollment_id])
        progressSummary[p.enrollment_id] = { done: 0, total: 0, skipped: 0 }
      if (p.status === 'done') progressSummary[p.enrollment_id].done += p.cnt
      if (p.status === 'skipped')
        progressSummary[p.enrollment_id].skipped += p.cnt
      progressSummary[p.enrollment_id].total += p.cnt
    }
  }

  const stepCounts: Record<string, number> = {}
  const actionIds = [...new Set(typedRows(rows).map((r) => r.action_id))]
  if (actionIds.length > 0) {
    const ph = actionIds.map(() => '?').join(',')
    const counts = await c.env.DB.prepare(
      `SELECT action_id, COUNT(*) as cnt FROM steps WHERE action_id IN (${ph}) GROUP BY action_id`
    )
      .bind(...actionIds)
      .all<{ action_id: string; cnt: number }>()
    for (const row of typedRows(counts)) {
      stepCounts[row.action_id] = row.cnt
    }
  }

  const items = typedRows(rows).map((r) => {
    const summary = progressSummary[r.id] || {
      done: 0,
      total: 0,
      skipped: 0
    }
    const stepCount = stepCounts[r.action_id] ?? 0
    const terminal = summary.done + summary.skipped
    const percent =
      stepCount > 0 ? Math.round((summary.done / stepCount) * 100) : 0
    const isCompleted = stepCount > 0 && terminal >= stepCount

    return {
      ...formatEnrollment(r),
      actionTitle: r.action_title,
      actionSlug: r.action_slug,
      progress: {
        done: summary.done,
        skipped: summary.skipped,
        stepCount,
        percent
      },
      isCompleted
    }
  })

  return c.json({ items })
})

// DELETE /api/enrollments/:id — abandon guide (drops progress via CASCADE)
enrollments.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const enroll = await c.env.DB.prepare(
    'SELECT id FROM enrollments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first()

  if (!enroll) return c.json({ error: 'Enrollment not found' }, 404)

  await c.env.DB.prepare('DELETE FROM enrollments WHERE id = ?').bind(id).run()

  return c.body(null, 204)
})

// GET /api/enrollments/:id  (with steps + current progress)
enrollments.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const enroll = await c.env.DB.prepare(
    `SELECT e.*, a.title as action_title, a.slug as action_slug
     FROM enrollments e JOIN actions a ON a.id = e.action_id
     WHERE e.id = ? AND e.user_id = ?`
  )
    .bind(id, userId)
    .first<EnrollmentRow & { action_title: string; action_slug: string }>()

  if (!enroll) return c.json({ error: 'Enrollment not found' }, 404)

  const stepsRes = await c.env.DB.prepare(
    `SELECT s.* FROM steps s WHERE s.action_id = ? ORDER BY s."order" ASC`
  )
    .bind(enroll.action_id)
    .all<StepRow & { action_id: string }>()

  const steps = typedRows(stepsRes)

  const progRes = await c.env.DB.prepare(
    'SELECT * FROM step_progress WHERE enrollment_id = ?'
  )
    .bind(id)
    .all<ProgressRow>()

  const progressMap: Record<string, ReturnType<typeof formatProgress>> = {}
  for (const p of typedRows(progRes)) {
    progressMap[p.step_id] = formatProgress(p)
  }

  return c.json({
    enrollment: {
      ...formatEnrollment(enroll),
      actionTitle: enroll.action_title,
      actionSlug: enroll.action_slug
    },
    steps: steps.map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title,
      bodyMd: s.body_md,
      estimatedMinutes: s.estimated_minutes
    })),
    progress: progressMap
  })
})

// PATCH /api/enrollments/:id/progress
enrollments.patch('/:id/progress', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = progressPatchSchema.parse(await c.req.json())

  // Verify ownership
  const enroll = await c.env.DB.prepare(
    'SELECT id, action_id FROM enrollments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<{ id: string; action_id: string }>()
  if (!enroll) return c.json({ error: 'Enrollment not found' }, 404)

  // Verify step belongs to action
  const step = await c.env.DB.prepare(
    'SELECT id FROM steps WHERE id = ? AND action_id = ?'
  )
    .bind(payload.stepId, enroll.action_id)
    .first()
  if (!step) return c.json({ error: 'Step not part of this action' }, 400)

  const now = nowIso()
  const status = payload.status ?? 'pending'
  const note = payload.note !== undefined ? payload.note : null

  // Upsert progress
  await c.env.DB.prepare(
    `INSERT INTO step_progress (enrollment_id, step_id, status, note, completed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(enrollment_id, step_id) DO UPDATE SET
       status = excluded.status,
       note = excluded.note,
       completed_at = excluded.completed_at`
  )
    .bind(
      id,
      payload.stepId,
      status,
      note,
      status === 'done' || status === 'skipped' ? now : null
    )
    .run()

  // Update enrollment updated_at (and optionally last_step_id)
  await c.env.DB.prepare(
    'UPDATE enrollments SET updated_at = ?, last_step_id = COALESCE(?, last_step_id) WHERE id = ?'
  )
    .bind(now, payload.stepId, id)
    .run()

  const updatedProg = await c.env.DB.prepare(
    'SELECT * FROM step_progress WHERE enrollment_id = ? AND step_id = ?'
  )
    .bind(id, payload.stepId)
    .first<ProgressRow>()

  return c.json({ progress: formatProgress(updatedProg!) })
})

export { enrollments }
