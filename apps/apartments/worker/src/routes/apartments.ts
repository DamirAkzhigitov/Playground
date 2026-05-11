import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { applyInspectionTemplate } from '../applyInspectionTemplate'
import {
  DEFAULT_INSPECTION_TEMPLATE_SLUG,
  INSPECTION_TEMPLATES_BY_SLUG
} from '../inspectionTemplates'
import { typedRows, formatApartment, nowIso } from '../helpers'

const apartmentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).nullable().optional(),
  price: z.number().finite().nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  templateSlug: z.string().trim().min(1).max(80).optional()
})

const apartmentPatchSchema = apartmentSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one field is required'
  })

const apartments = new Hono<AppEnv>()

apartments.get('/', async (c) => {
  const userId = c.get('userId')
  const result = await c.env.DB.prepare(
    `SELECT
       a.id,
       a.title,
       a.address,
       a.price,
       a.notes,
       a.created_at,
       a.updated_at,
       (
         SELECT COUNT(*)
         FROM questions q
         WHERE q.is_archived = 0
           AND q.user_id = ?
           AND (
             q.apartment_id = a.id
             OR (
               q.apartment_id IS NULL
               AND NOT EXISTS (
                 SELECT 1 FROM questions qs
                 WHERE qs.user_id = q.user_id AND qs.apartment_id = a.id
               )
             )
           )
       ) AS total_questions,
       (
         SELECT COUNT(*)
         FROM questions q
         INNER JOIN answers ans
           ON ans.question_id = q.id AND ans.apartment_id = a.id
         WHERE q.is_archived = 0
           AND q.user_id = ?
           AND (
             q.apartment_id = a.id
             OR (
               q.apartment_id IS NULL
               AND NOT EXISTS (
                 SELECT 1 FROM questions qs
                 WHERE qs.user_id = q.user_id AND qs.apartment_id = a.id
               )
             )
           )
           AND ans.value IS NOT NULL
           AND TRIM(ans.value) != ''
           AND TRIM(ans.value) != '[]'
           AND (
             q.type != 'multi-select'
             OR (
               json_valid(TRIM(ans.value)) = 1
               AND json_type(TRIM(ans.value)) = 'array'
               AND json_array_length(TRIM(ans.value)) > 0
             )
           )
       ) AS answered_questions,
       (
         SELECT COUNT(*)
         FROM questions q
         LEFT JOIN answers ans
           ON ans.question_id = q.id AND ans.apartment_id = a.id
         WHERE q.is_archived = 0
           AND q.user_id = ?
           AND (
             q.apartment_id = a.id
             OR (
               q.apartment_id IS NULL
               AND NOT EXISTS (
                 SELECT 1 FROM questions qs
                 WHERE qs.user_id = q.user_id AND qs.apartment_id = a.id
               )
             )
           )
           AND q.required = 1
           AND NOT (
             ans.id IS NOT NULL
             AND ans.value IS NOT NULL
             AND TRIM(ans.value) != ''
             AND TRIM(ans.value) != '[]'
             AND (
               q.type != 'multi-select'
               OR (
                 json_valid(TRIM(ans.value)) = 1
                 AND json_type(TRIM(ans.value)) = 'array'
                 AND json_array_length(TRIM(ans.value)) > 0
               )
             )
           )
       ) AS critical_missing
     FROM apartments a
     WHERE a.user_id = ?
     ORDER BY a.created_at DESC`
  )
    .bind(userId, userId, userId, userId)
    .all<Record<string, unknown>>()

  const list = typedRows(result).map((row) => {
    const answered = Number(row.answered_questions ?? 0)
    const total = Number(row.total_questions ?? 0)
    const criticalMissing = Number(row.critical_missing ?? 0)
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0
    return {
      ...formatApartment(row),
      completion: {
        answeredQuestions: answered,
        totalQuestions: total,
        percent,
        criticalMissingCount: criticalMissing
      }
    }
  })
  return c.json(list)
})

apartments.post('/', async (c) => {
  const userId = c.get('userId')
  const payload = apartmentSchema.parse(await c.req.json())
  const templateSlug =
    payload.templateSlug?.trim() ?? DEFAULT_INSPECTION_TEMPLATE_SLUG
  if (!INSPECTION_TEMPLATES_BY_SLUG[templateSlug]) {
    return c.json({ error: 'Unknown inspection template' }, 400)
  }
  const id = crypto.randomUUID()
  const timestamp = nowIso()
  await c.env.DB.prepare(
    'INSERT INTO apartments (id, title, address, price, notes, created_at, updated_at, user_id, template_slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(
      id,
      payload.title,
      payload.address ?? null,
      payload.price ?? null,
      payload.notes ?? null,
      timestamp,
      timestamp,
      userId,
      templateSlug
    )
    .run()
  await applyInspectionTemplate(c.env.DB, userId, id, templateSlug)
  return c.json(
    {
      id,
      title: payload.title,
      address: payload.address ?? null,
      price: payload.price ?? null,
      notes: payload.notes ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      templateSlug
    },
    201
  )
})

apartments.patch('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const payload = apartmentPatchSchema.parse(await c.req.json())
  const timestamp = nowIso()
  const result = await c.env.DB.prepare(
    `UPDATE apartments
     SET title = COALESCE(?, title),
         address = COALESCE(?, address),
         price = COALESCE(?, price),
         notes = COALESCE(?, notes),
         updated_at = ?
     WHERE id = ? AND user_id = ?`
  )
    .bind(
      payload.title ?? null,
      payload.address ?? null,
      payload.price ?? null,
      payload.notes ?? null,
      timestamp,
      id,
      userId
    )
    .run()

  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Apartment not found' }, 404)
  }

  const apartment = await c.env.DB.prepare(
    'SELECT id, title, address, price, notes, created_at, updated_at, template_slug FROM apartments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<Record<string, unknown>>()
  return c.json(formatApartment(apartment ?? {}))
})

apartments.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const apartment = await c.env.DB.prepare(
    'SELECT id, title, address, price, notes, created_at, updated_at, template_slug FROM apartments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .first<Record<string, unknown>>()
  if (!apartment) {
    return c.json({ error: 'Apartment not found' }, 404)
  }

  const answersResult = await c.env.DB.prepare(
    'SELECT id, apartment_id, question_id, value, note, updated_at FROM answers WHERE apartment_id = ? ORDER BY updated_at DESC'
  )
    .bind(id)
    .all<Record<string, unknown>>()
  const photosResult = await c.env.DB.prepare(
    'SELECT id, apartment_id, question_id, r2_key, created_at FROM photos WHERE apartment_id = ? ORDER BY created_at DESC'
  )
    .bind(id)
    .all<Record<string, unknown>>()

  return c.json({
    ...formatApartment(apartment),
    answers: typedRows(answersResult).map((row) => ({
      id: row.id,
      apartmentId: row.apartment_id,
      questionId: row.question_id,
      value: row.value,
      note: row.note,
      updatedAt: row.updated_at
    })),
    photos: typedRows(photosResult).map((row) => ({
      id: row.id,
      apartmentId: row.apartment_id,
      questionId: row.question_id,
      r2Key: row.r2_key,
      createdAt: row.created_at
    }))
  })
})

apartments.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const photos = await c.env.DB.prepare(
    'SELECT p.r2_key FROM photos p INNER JOIN apartments a ON a.id = p.apartment_id WHERE a.id = ? AND a.user_id = ?'
  )
    .bind(id, userId)
    .all<{ r2_key: string }>()
  await Promise.all(
    typedRows(photos).map((photo) => c.env.PHOTOS.delete(photo.r2_key))
  )
  const result = await c.env.DB.prepare(
    'DELETE FROM apartments WHERE id = ? AND user_id = ?'
  )
    .bind(id, userId)
    .run()
  if ((result.meta.changes ?? 0) === 0) {
    return c.json({ error: 'Apartment not found' }, 404)
  }
  return c.body(null, 204)
})

export { apartments }
