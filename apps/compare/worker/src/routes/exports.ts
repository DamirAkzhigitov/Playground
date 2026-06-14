import { Hono } from 'hono'
import * as XLSX from 'xlsx'
import type { AppEnv } from '../types'
import { typedRows, nowIso } from '../helpers'
import { neutralizeSpreadsheetCell } from '../spreadsheetSafe'
import { loadSpecTemplate } from '../spec-template'

const exports_ = new Hono<AppEnv>()

exports_.get('/json', async (c) => {
  const userId = c.get('userId')!
  const dump: Record<string, unknown[]> = {}

  dump.item_types = typedRows(
    await c.env.DB.prepare(
      'SELECT id, slug, name, icon, is_system, user_id, "order", created_at FROM item_types WHERE is_system = 1 OR user_id = ?'
    )
      .bind(userId)
      .all()
  )

  dump.items = typedRows(
    await c.env.DB.prepare(
      'SELECT id, item_type_id, title, notes, is_public, created_at, updated_at FROM items WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  const itemIds = (dump.items as { id: string }[]).map((i) => i.id)
  if (itemIds.length > 0) {
    const ph = itemIds.map(() => '?').join(',')
    dump.answers = typedRows(
      await c.env.DB.prepare(
        `SELECT id, item_id, spec_id, value, note, updated_at FROM answers WHERE item_id IN (${ph})`
      )
        .bind(...itemIds)
        .all()
    )
    dump.photos = typedRows(
      await c.env.DB.prepare(
        `SELECT id, item_id, spec_id, r2_key, created_at FROM photos WHERE item_id IN (${ph})`
      )
        .bind(...itemIds)
        .all()
    )
  } else {
    dump.answers = []
    dump.photos = []
  }

  dump.compare_groups = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, item_type_id, is_public, selection_mode, created_at, updated_at FROM compare_groups WHERE user_id = ?'
    )
      .bind(userId)
      .all()
  )

  return c.json({ exportedAt: nowIso(), data: dump })
})

exports_.get('/xlsx', async (c) => {
  const userId = c.get('userId')!
  const itemRows = typedRows(
    await c.env.DB.prepare(
      'SELECT id, title, notes, item_type_id FROM items WHERE user_id = ? ORDER BY created_at DESC'
    )
      .bind(userId)
      .all()
  )

  if (itemRows.length === 0) {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([['No items']]),
      'Items'
    )
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    return new Response(buf, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="items_export_${nowIso().slice(0, 10)}.xlsx"`
      }
    })
  }

  const typeIds = [...new Set(itemRows.map((r) => String(r.item_type_id)))]
  const specLabels: { id: string; label: string }[] = []
  for (const typeId of typeIds) {
    const sections = await loadSpecTemplate(c.env.DB, typeId)
    for (const section of sections) {
      for (const spec of (section.specs as { id: string; label: string }[]) ??
        []) {
        specLabels.push({ id: String(spec.id), label: String(spec.label) })
      }
    }
  }

  const itemIds = itemRows.map((r) => String(r.id))
  const ph = itemIds.map(() => '?').join(',')
  const answerRows = typedRows(
    await c.env.DB.prepare(
      `SELECT item_id, spec_id, value FROM answers WHERE item_id IN (${ph})`
    )
      .bind(...itemIds)
      .all()
  )
  const answersByItem = new Map<string, Map<string, string>>()
  for (const row of answerRows) {
    const itemId = String(row.item_id)
    const map = answersByItem.get(itemId) ?? new Map()
    map.set(String(row.spec_id), String(row.value ?? ''))
    answersByItem.set(itemId, map)
  }

  const header = ['Title', 'Notes', ...specLabels.map((s) => s.label)]
  const dataRows = itemRows.map((item) => {
    const am = answersByItem.get(String(item.id)) ?? new Map()
    return [
      neutralizeSpreadsheetCell(String(item.title)),
      neutralizeSpreadsheetCell(String(item.notes ?? '')),
      ...specLabels.map((s) => neutralizeSpreadsheetCell(am.get(s.id) ?? ''))
    ]
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([header, ...dataRows]),
    'Items'
  )
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Response(buf, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="items_export_${nowIso().slice(0, 10)}.xlsx"`
    }
  })
})

export { exports_ }
