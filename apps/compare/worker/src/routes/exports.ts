import { Hono } from 'hono'
import * as XLSX from 'xlsx'
import type { AppEnv } from '../types'
import { typedRows, nowIso } from '../helpers'
import { neutralizeSpreadsheetCell } from '../spreadsheetSafe'

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

  dump.listings = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, address, price, notes, created_at, updated_at FROM listings WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  const listingIds = (dump.listings as { id: string }[]).map((a) => a.id)
  if (listingIds.length > 0) {
    const ph = listingIds.map(() => '?').join(',')
    dump.answers = typedRows(
      await c.env.DB.prepare(
        `SELECT id, listing_id, question_id, value, note, updated_at FROM answers WHERE listing_id IN (${ph})`
      )
        .bind(...listingIds)
        .all()
    )
    dump.photos = typedRows(
      await c.env.DB.prepare(
        `SELECT id, listing_id, question_id, r2_key, created_at FROM photos WHERE listing_id IN (${ph})`
      )
        .bind(...listingIds)
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
  const listingRows = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, address, price, notes FROM listings WHERE user_id = ? ORDER BY created_at DESC'
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

  const listingIds = listingRows.map((a) => String(a.id))
  let answerRows: Record<string, unknown>[] = []
  if (listingIds.length > 0) {
    const ph = listingIds.map(() => '?').join(',')
    answerRows = typedRows(
      await c.env.DB.prepare(
        `SELECT listing_id, question_id, value FROM answers WHERE listing_id IN (${ph})`
      )
        .bind(...listingIds)
        .all()
    )
  }

  const answersByListing = new Map<string, Map<string, string | null>>()
  for (const answerRow of answerRows) {
    const listingId = String(answerRow.listing_id)
    const questionId = String(answerRow.question_id)
    const listingAnswers =
      answersByListing.get(listingId) ?? new Map<string, string | null>()
    listingAnswers.set(questionId, (answerRow.value as string | null) ?? null)
    answersByListing.set(listingId, listingAnswers)
  }

  const records = listingRows.map((listingRow) => {
    const baseRecord: Record<string, string | number | null> = {
      listingId: neutralizeSpreadsheetCell(String(listingRow.id)),
      title: neutralizeSpreadsheetCell(String(listingRow.title)),
      address: neutralizeSpreadsheetCell(
        (listingRow.address as string | null) ?? null
      ),
      price: (listingRow.price as number | null) ?? null,
      notes: neutralizeSpreadsheetCell(
        (listingRow.notes as string | null) ?? null
      )
    }
    const listingAnswers =
      answersByListing.get(String(listingRow.id)) ?? new Map()
    for (const questionRow of questionRows) {
      const labelKey = neutralizeSpreadsheetCell(String(questionRow.label))
      if (typeof labelKey !== 'string') continue
      baseRecord[labelKey] = neutralizeSpreadsheetCell(
        listingAnswers.get(String(questionRow.id)) ?? null
      )
    }
    return baseRecord
  })

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(records)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Listings')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="listings_export_${new Date().toISOString().slice(0, 10)}.xlsx"`
    }
  })
})

export { exports_ }
