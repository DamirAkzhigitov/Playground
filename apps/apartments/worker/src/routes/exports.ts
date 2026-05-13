import { Hono } from 'hono'
import * as XLSX from 'xlsx'
import type { AppEnv } from '../types'
import { typedRows, nowIso } from '../helpers'

const exports_ = new Hono<AppEnv>()

exports_.get('/json', async (c) => {
  const userId = c.get('userId')
  const dump: Record<string, unknown[]> = {}

  dump.categories = typedRows(
    await c.env.DB.prepare(
      'SELECT id, name, "order" FROM categories WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  dump.questions = typedRows(
    await c.env.DB.prepare(
      'SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, value_preference FROM questions WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  const questionIds = (dump.questions as { id: string }[]).map((q) => q.id)
  if (questionIds.length > 0) {
    const ph = questionIds.map(() => '?').join(',')
    dump.question_options = typedRows(
      await c.env.DB.prepare(
        `SELECT id, question_id, label, value, "order" FROM question_options WHERE question_id IN (${ph})`
      )
        .bind(...questionIds)
        .all()
    )
  } else {
    dump.question_options = []
  }

  dump.apartments = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, address, price, notes, created_at, updated_at FROM apartments WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  const apartmentIds = (dump.apartments as { id: string }[]).map((a) => a.id)
  if (apartmentIds.length > 0) {
    const ph = apartmentIds.map(() => '?').join(',')
    dump.answers = typedRows(
      await c.env.DB.prepare(
        `SELECT id, apartment_id, question_id, value, note, updated_at FROM answers WHERE apartment_id IN (${ph})`
      )
        .bind(...apartmentIds)
        .all()
    )
    dump.photos = typedRows(
      await c.env.DB.prepare(
        `SELECT id, apartment_id, question_id, r2_key, created_at FROM photos WHERE apartment_id IN (${ph})`
      )
        .bind(...apartmentIds)
        .all()
    )
  } else {
    dump.answers = []
    dump.photos = []
  }

  return c.json({ exportedAt: nowIso(), data: dump })
})

exports_.get('/xlsx', async (c) => {
  const userId = c.get('userId')
  const apartmentRows = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, address, price, notes FROM apartments WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all()
  )
  const questionRows = typedRows(
    await c.env.DB.prepare(
      'SELECT id, label FROM questions WHERE is_archived = 0 AND user_id = ? ORDER BY category_id ASC, "order" ASC'
    )
      .bind(userId)
      .all()
  )

  const apartmentIds = apartmentRows.map((a) => String(a.id))
  let answerRows: Record<string, unknown>[] = []
  if (apartmentIds.length > 0) {
    const ph = apartmentIds.map(() => '?').join(',')
    answerRows = typedRows(
      await c.env.DB.prepare(
        `SELECT apartment_id, question_id, value FROM answers WHERE apartment_id IN (${ph})`
      )
        .bind(...apartmentIds)
        .all()
    )
  }

  const answersByApartment = new Map<string, Map<string, string | null>>()
  for (const answerRow of answerRows) {
    const apartmentId = String(answerRow.apartment_id)
    const questionId = String(answerRow.question_id)
    const apartmentAnswers =
      answersByApartment.get(apartmentId) ?? new Map<string, string | null>()
    apartmentAnswers.set(questionId, (answerRow.value as string | null) ?? null)
    answersByApartment.set(apartmentId, apartmentAnswers)
  }

  const records = apartmentRows.map((apartmentRow) => {
    const baseRecord: Record<string, string | number | null> = {
      apartmentId: String(apartmentRow.id),
      title: String(apartmentRow.title),
      address: (apartmentRow.address as string | null) ?? null,
      price: (apartmentRow.price as number | null) ?? null,
      notes: (apartmentRow.notes as string | null) ?? null
    }
    const apartmentAnswers =
      answersByApartment.get(String(apartmentRow.id)) ?? new Map()
    for (const questionRow of questionRows) {
      baseRecord[String(questionRow.label)] =
        apartmentAnswers.get(String(questionRow.id)) ?? null
    }
    return baseRecord
  })

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(records)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Apartments')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="apartments_export_${new Date().toISOString().slice(0, 10)}.xlsx"`
    }
  })
})

export { exports_ }
