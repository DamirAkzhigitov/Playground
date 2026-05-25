import { z } from 'zod'
import { Hono } from 'hono'
import { requireAuth } from '@playground/auth-core'
import type { AppEnv } from '../types'

const localeSchema = z.enum(['en', 'ru', 'el'])

export const profile = new Hono<AppEnv>()

profile.patch('/locale', requireAuth, async (c) => {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const { locale } = z
    .object({ locale: localeSchema })
    .parse(await c.req.json())

  await c.env.DB.prepare('UPDATE users SET locale = ? WHERE id = ?')
    .bind(locale, userId)
    .run()

  const user = await c.env.DB.prepare(
    'SELECT id, email, locale, createdAt FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{
      id: string
      email: string
      locale: string
      createdAt: number
    }>()

  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({
    id: user.id,
    email: user.email,
    locale: user.locale,
    createdAt: new Date(user.createdAt).toISOString()
  })
})
