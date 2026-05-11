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
      'SELECT id, name, "order", apartment_id FROM categories WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  dump.questions = typedRows(
    await c.env.DB.prepare(
      'SELECT id, label, type, category_id, required, is_archived, "order", rating_min, rating_max, apartment_id, stable_key FROM questions WHERE user_id = ?'
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
      'SELECT id, title, address, price, notes, created_at, updated_at, template_slug FROM apartments WHERE user_id = ?'
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
      'SELECT id, title, address, price, notes, template_slug FROM apartments WHERE user_id = ? ORDER BY created_at DESC'
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

  const questionSql = `SELECT id, label, stable_key FROM questions q
     WHERE q.is_archived = 0 AND q.user_id = ?
     AND (
       q.apartment_id = ?
       OR (
         q.apartment_id IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM questions qs
           WHERE qs.user_id = q.user_id AND qs.apartment_id = ?
         )
       )
     )
     ORDER BY q.category_id ASC, q."order" ASC`

  const records: Record<string, string | number | null>[] = []
  for (const apartmentRow of apartmentRows) {
    const aptId = String(apartmentRow.id)
    const questionRows = typedRows(
      await c.env.DB.prepare(questionSql).bind(userId, aptId, aptId).all()
    )
    const baseRecord: Record<string, string | number | null> = {
      apartmentId: aptId,
      title: String(apartmentRow.title),
      address: (apartmentRow.address as string | null) ?? null,
      price: (apartmentRow.price as number | null) ?? null,
      notes: (apartmentRow.notes as string | null) ?? null,
      templateSlug:
        apartmentRow.template_slug != null
          ? String(apartmentRow.template_slug)
          : null
    }
    const apartmentAnswers = answersByApartment.get(aptId) ?? new Map()
    for (const questionRow of questionRows) {
      const qid = String(questionRow.id)
      const colKey =
        questionRow.stable_key != null && String(questionRow.stable_key).trim()
          ? String(questionRow.stable_key)
          : `question:${qid}`
      baseRecord[colKey] = apartmentAnswers.get(qid) ?? null
    }
    records.push(baseRecord)
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(records)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Listings')
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
