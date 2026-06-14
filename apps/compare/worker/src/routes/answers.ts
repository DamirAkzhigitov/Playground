import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { nowIso } from '../helpers'

const MAX_ANSWER_VALUE_CHARS = 50_000
const MAX_ANSWER_NOTE_CHARS = 5_000
const MAX_ANSWERS_PER_REQUEST = 200

const answerInputSchema = z.object({
  itemId: z.string().trim().min(1),
  specId: z.string().trim().min(1),
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
  const userId = c.get('userId')!
  const payload = answersPayloadSchema.parse(await c.req.json())
  const items = 'answer' in payload ? [payload.answer] : payload.answers
  const timestamp = nowIso()

  const itemIds = [...new Set(items.map((a) => a.itemId))]
  for (const itemId of itemIds) {
    const owns = await c.env.DB.prepare(
      'SELECT 1 FROM items WHERE id = ? AND user_id = ?'
    )
      .bind(itemId, userId)
      .first()
    if (!owns) return c.json({ error: 'Item not found' }, 404)
  }

  const statements = items.map((answer) =>
    c.env.DB.prepare(
      `INSERT INTO answers (id, item_id, spec_id, value, note, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(item_id, spec_id)
       DO UPDATE SET value = excluded.value, note = excluded.note, updated_at = excluded.updated_at`
    ).bind(
      crypto.randomUUID(),
      answer.itemId,
      answer.specId,
      answer.value,
      answer.note ?? null,
      timestamp
    )
  )

  await c.env.DB.batch(statements)
  return c.json({ ok: true, updated: items.length })
})

export { answers }
