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
