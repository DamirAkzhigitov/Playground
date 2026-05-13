import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../types'
import { nowIso } from '../helpers'
import {
  MAX_PHOTO_BYTES,
  detectImageContentType,
  safePhotoFilename
} from '../photoSecurity'

const uploadPhotoSchema = z.object({
  listingId: z.string().trim().min(1),
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
    listingId: formData.get('listingId'),
    questionId: formData.get('questionId') ?? undefined
  })

  const owns = await c.env.DB.prepare(
    'SELECT 1 FROM listings WHERE id = ? AND user_id = ?'
  )
    .bind(payload.listingId, userId)
    .first()
  if (!owns) return c.json({ error: 'Listing not found' }, 404)

  const buffer = await file.arrayBuffer()
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    return c.json(
      { error: `Photo must be at most ${MAX_PHOTO_BYTES / (1024 * 1024)} MB` },
      413
    )
  }
  const bytes = new Uint8Array(buffer)
  const contentType = detectImageContentType(bytes)
  if (!contentType) {
    return c.json(
      { error: 'Only JPEG, PNG, GIF, and WebP images are allowed' },
      400
    )
  }

  const id = crypto.randomUUID()
  const safeName = safePhotoFilename(file.name)
  const key = `${payload.listingId}-${Date.now()}-${id}-${safeName}`

  await c.env.PHOTOS.put(key, buffer, {
    httpMetadata: {
      contentType
    }
  })

  const createdAt = nowIso()
  await c.env.DB.prepare(
    'INSERT INTO photos (id, listing_id, question_id, r2_key, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(id, payload.listingId, payload.questionId ?? null, key, createdAt)
    .run()

  return c.json(
    {
      id,
      listingId: payload.listingId,
      questionId: payload.questionId ?? null,
      r2Key: key,
      createdAt
    },
    201
  )
})

photos.get('/:key', async (c) => {
  const userId = c.get('userId')
  const paramKey = c.req.param('key')
  const key = decodeURIComponent(paramKey)

  const row = await c.env.DB.prepare(
    `SELECT p.r2_key FROM photos p
     INNER JOIN listings a ON a.id = p.listing_id
     WHERE p.r2_key = ? AND a.user_id = ?`
  )
    .bind(key, userId)
    .first<{ r2_key: string }>()
  if (!row) {
    return c.json({ error: 'Photo not found' }, 404)
  }

  const object = await c.env.PHOTOS.get(row.r2_key)
  if (!object?.body) {
    return c.json({ error: 'Photo not found' }, 404)
  }

  const buf = await object.arrayBuffer()
  const sniffed = detectImageContentType(new Uint8Array(buf))
  if (!sniffed) {
    return c.json({ error: 'Photo not found' }, 404)
  }

  const headers = new Headers()
  headers.set('Content-Type', sniffed)
  headers.set('X-Content-Type-Options', 'nosniff')
  if (object.httpEtag) {
    headers.set('etag', object.httpEtag)
  }
  headers.set('Cache-Control', 'private, max-age=3600')

  return new Response(buf, { headers })
})

photos.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const photo = await c.env.DB.prepare(
    `SELECT p.r2_key FROM photos p
     INNER JOIN listings a ON a.id = p.listing_id
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
