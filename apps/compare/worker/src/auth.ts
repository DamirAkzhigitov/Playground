import { z } from 'zod'
import { createAuthRoutes, requireAuth } from '@playground/auth-core'
import { seedDefaultData } from './seed'
import type { AppEnv } from './types'

const localeSchema = z.enum(['en', 'ru', 'el'])

function normalizeLocale(
  locale: string | null | undefined
): 'en' | 'ru' | 'el' {
  return locale === 'ru' || locale === 'el' ? locale : 'en'
}

export const auth = createAuthRoutes<AppEnv>({
  insertUser: async (db, { userId, email, passwordHash, now }) => {
    await db
      .prepare(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)'
      )
      .bind(userId, email, passwordHash, now)
      .run()
  },
  onAfterRegister: (db, userId) => seedDefaultData(db, userId),
  selectUserForLogin: async (db, email) => {
    return db
      .prepare(
        'SELECT id, email, password_hash, created_at, locale FROM users WHERE email = ?'
      )
      .bind(email)
      .first<{
        id: string
        email: string
        password_hash: string
        created_at: string
        locale: string
      }>()
  },
  selectUserForMe: async (db, userId) => {
    return db
      .prepare('SELECT id, email, created_at, locale FROM users WHERE id = ?')
      .bind(userId)
      .first<{
        id: string
        email: string
        created_at: string
        locale: string
      }>()
  },
  formatAuthUser: (row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    locale: normalizeLocale(row.locale as string | undefined)
  }),
  registerExtraRoutes: (router) => {
    router.patch('/me', requireAuth, async (c) => {
      const userId = c.get('userId')
      const body = z.object({ locale: localeSchema }).parse(await c.req.json())

      await c.env.DB.prepare('UPDATE users SET locale = ? WHERE id = ?')
        .bind(body.locale, userId)
        .run()

      const user = await c.env.DB.prepare(
        'SELECT id, email, created_at, locale FROM users WHERE id = ?'
      )
        .bind(userId)
        .first<{
          id: string
          email: string
          created_at: string
          locale: string
        }>()
      if (!user) return c.json({ error: 'User not found' }, 404)
      return c.json({
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        locale: normalizeLocale(user.locale)
      })
    })
  }
})
