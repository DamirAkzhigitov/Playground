import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { nowIso } from '../helpers'

const MAX_ANSWER_VALUE_CHARS = 50_000
const MAX_ANSWER_NOTE_CHARS = 5_000
/** D1 batch limits and abuse prevention — keep well under platform caps. */
const MAX_ANSWERS_PER_REQUEST = 200

const answerInputSchema = z.object({
  apartmentId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  value: z.union([z.string().max(MAX_ANSWER_VALUE_CHARS), z.null()]),
  note: z.string().trim().max(MAX_ANSWER_NOTE_CHARS).nullable().optional()
})

const answersPayloadSchema = z.union([
  z.object({ answer: answerInputSchema }),
  z.object({
    answers: z.array(answerInputSchema).min(1).max(MAX_ANSWERS_PER_REQUEST)
  })
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
