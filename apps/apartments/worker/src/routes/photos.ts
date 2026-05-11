import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { nowIso } from '../helpers'

const uploadPhotoSchema = z.object({
  apartmentId: z.string().trim().min(1),
  questionId: z.string().trim().min(1).optional()
})

type UploadFile = {
  name: string
  type?: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

const isUploadFile = (value: unknown): value is UploadFile =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  'arrayBuffer' in value &&
  typeof (value as UploadFile).name === 'string' &&
  typeof (value as UploadFile).arrayBuffer === 'function'

const photos = new Hono<AppEnv>()

photos.post('/upload', async (c) => {
  const userId = c.get('userId')
  const formData = await c.req.formData()
  const file = formData.get('file')
  if (!isUploadFile(file)) {
    return c.json({ error: 'file is required' }, 400)
  }

  const payload = uploadPhotoSchema.parse({
    apartmentId: formData.get('apartmentId'),
    questionId: formData.get('questionId') ?? undefined
  })

  const owns = await c.env.DB.prepare(
    'SELECT 1 FROM apartments WHERE id = ? AND user_id = ?'
  )
    .bind(payload.apartmentId, userId)
    .first()
  if (!owns) return c.json({ error: 'Apartment not found' }, 404)

  const id = crypto.randomUUID()
  const key = `${payload.apartmentId}-${Date.now()}-${id}-${file.name}`

  await c.env.PHOTOS.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream'
    }
  })

  const createdAt = nowIso()
  await c.env.DB.prepare(
    'INSERT INTO photos (id, apartment_id, question_id, r2_key, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(id, payload.apartmentId, payload.questionId ?? null, key, createdAt)
    .run()

  return c.json(
    {
      id,
      apartmentId: payload.apartmentId,
      questionId: payload.questionId ?? null,
      r2Key: key,
      createdAt
    },
    201
  )
})

photos.get('/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.PHOTOS.get(key)
  if (!object) {
    return c.json({ error: 'Photo not found' }, 404)
  }
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { headers })
})

photos.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const photo = await c.env.DB.prepare(
    `SELECT p.r2_key FROM photos p
     INNER JOIN apartments a ON a.id = p.apartment_id
     WHERE p.id = ? AND a.user_id = ?`
  )
    .bind(id, userId)
    .first<{ r2_key: string }>()
  if (!photo) {
    return c.json({ error: 'Photo not found' }, 404)
  }
  await c.env.PHOTOS.delete(photo.r2_key)
  await c.env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run()
  return c.body(null, 204)
})

export { photos }
