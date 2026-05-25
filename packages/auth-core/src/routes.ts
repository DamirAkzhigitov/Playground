import { Hono } from 'hono'
import { z } from 'zod'
import { hashPassword, verifyPassword } from './crypto.js'
import { requireAuth, type AuthEnv } from './middleware.js'
import {
  clearSessionCookie,
  sessionExpiresAt,
  setSessionCookie
} from './session.js'
import type { AuthDb, AuthHooks } from './types.js'

const registerSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128)
})

const loginSchema = registerSchema

async function createSession(db: AuthDb, userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = sessionExpiresAt()
  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt)
    .run()
  return sessionId
}

export type CreateAuthRoutesOptions<E extends AuthEnv = AuthEnv> = AuthHooks & {
  registerExtraRoutes?: (auth: Hono<E>) => void
}

export function createAuthRoutes<E extends AuthEnv>(
  hooks: CreateAuthRoutesOptions<E>
): Hono<E> {
  const auth = new Hono<E>()
  const cookieOpts = hooks.sessionCookieOptions

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
    const now = new Date().toISOString()

    await hooks.insertUser(c.env.DB, {
      userId,
      email,
      passwordHash,
      now
    })

    if (hooks.onAfterRegister) {
      await hooks.onAfterRegister(c.env.DB, userId)
    }

    const sessionId = await createSession(c.env.DB, userId)
    setSessionCookie(c, sessionId, cookieOpts)

    const row = await hooks.selectUserForMe(c.env.DB, userId)
    if (!row) {
      return c.json({ error: 'User not found' }, 500)
    }
    return c.json(hooks.formatAuthUser(row), 201)
  })

  auth.post('/login', async (c) => {
    const payload = loginSchema.parse(await c.req.json())
    const email = payload.email.toLowerCase()

    const user = await hooks.selectUserForLogin(c.env.DB, email)
    if (!user?.password_hash) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const valid = await verifyPassword(payload.password, user.password_hash)
    if (!valid) return c.json({ error: 'Invalid email or password' }, 401)

    const sessionId = await createSession(c.env.DB, user.id)
    setSessionCookie(c, sessionId, cookieOpts)

    const { password_hash: _pw, ...safe } = user
    return c.json(hooks.formatAuthUser(safe as typeof user))
  })

  auth.post('/logout', requireAuth, async (c) => {
    const userId = c.get('userId')
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(userId)
      .run()
    clearSessionCookie(c, cookieOpts)
    return c.body(null, 204)
  })

  auth.get('/me', requireAuth, async (c) => {
    const userId = c.get('userId')
    const user = await hooks.selectUserForMe(c.env.DB, userId)
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json(hooks.formatAuthUser(user))
  })

  if (hooks.registerExtraRoutes) {
    hooks.registerExtraRoutes(auth)
  }

  return auth
}
