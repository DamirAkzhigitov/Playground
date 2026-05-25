import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { z } from 'zod'
import { hashPassword, verifyPassword } from './crypto'
import { requireAuth } from './middleware'
import type { AppEnv } from './types'
import { nowIso } from './helpers'

const SESSION_MAX_AGE = 30 * 24 * 60 * 60
const SESSION_COOKIE = 'session'

const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128)
})

const loginSchema = registerSchema

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
}

const auth = new Hono<AppEnv>()

auth.post('/register', async (c) => {
  const payload = registerSchema.parse(await c.req.json())
  const email = payload.email.toLowerCase()

  const existing = await c.env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  )
    .bind(email)
    .first()
  if (existing) {
    return c.json({ error: 'Could not complete registration.' }, 400)
  }

  const userId = crypto.randomUUID()
  const passwordHash = await hashPassword(payload.password)
  const now = nowIso()

  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(userId, email, passwordHash, 'user', now)
    .run()

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString()
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  )
    .bind(sessionId, userId, expiresAt)
    .run()

  setSessionCookie(c, sessionId)
  return c.json(
    { id: userId, email, role: 'user' as const, createdAt: now },
    201
  )
})

auth.post('/login', async (c) => {
  const payload = loginSchema.parse(await c.req.json())
  const email = payload.email.toLowerCase()

  const user = await c.env.DB.prepare(
    'SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?'
  )
    .bind(email)
    .first<{
      id: string
      email: string
      password_hash: string
      role: string
      created_at: string
    }>()
  if (!user) return c.json({ error: 'Invalid email or password' }, 401)

  const valid = await verifyPassword(payload.password, user.password_hash)
  if (!valid) return c.json({ error: 'Invalid email or password' }, 401)

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString()
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  )
    .bind(sessionId, user.id, expiresAt)
    .run()

  setSessionCookie(c, sessionId)
  return c.json({
    id: user.id,
    email: user.email,
    role: user.role as 'user' | 'contributor' | 'admin',
    createdAt: user.created_at
  })
})

auth.post('/logout', requireAuth, async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?')
    .bind(userId)
    .run()
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.body(null, 204)
})

auth.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId')
  const user = await c.env.DB.prepare(
    'SELECT id, email, role, created_at FROM users WHERE id = ?'
  )
    .bind(userId)
    .first<{ id: string; email: string; role: string; created_at: string }>()
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({
    id: user.id,
    email: user.email,
    role: user.role as 'user' | 'contributor' | 'admin',
    createdAt: user.created_at
  })
})

export { auth }
