import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { nowIso } from '../helpers'

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

const answers = new Hono<AppEnv>()

answers.post('/', async (c) => {
  const userId = c.get('userId')
  const payload = answersPayloadSchema.parse(await c.req.json())
  const items = 'answer' in payload ? [payload.answer] : payload.answers
  const timestamp = nowIso()

  const apartmentIds = [...new Set(items.map((a) => a.apartmentId))]
  for (const aptId of apartmentIds) {
    const owns = await c.env.DB.prepare(
      'SELECT 1 FROM apartments WHERE id = ? AND user_id = ?'
    )
      .bind(aptId, userId)
      .first()
    if (!owns) return c.json({ error: 'Apartment not found' }, 404)
  }

  for (const answer of items) {
    const qrow = await c.env.DB.prepare(
      'SELECT apartment_id FROM questions WHERE id = ? AND user_id = ?'
    )
      .bind(answer.questionId, userId)
      .first<{ apartment_id: string | null }>()
    if (!qrow) {
      return c.json({ error: 'Question not found' }, 404)
    }
    const qApt = qrow.apartment_id
    if (qApt !== null && qApt !== answer.apartmentId) {
      return c.json({ error: 'Question does not belong to this listing' }, 400)
    }
    if (qApt === null) {
      const scoped = await c.env.DB.prepare(
        'SELECT 1 FROM questions WHERE user_id = ? AND apartment_id = ? LIMIT 1'
      )
        .bind(userId, answer.apartmentId)
        .first()
      if (scoped) {
        return c.json(
          { error: 'This listing uses a template checklist only' },
          400
        )
      }
    }
  }

  const statements = items.map((answer) =>
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
  return c.json({ ok: true, updated: items.length })
})

export { answers }
