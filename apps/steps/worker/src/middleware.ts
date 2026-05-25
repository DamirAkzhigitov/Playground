import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import type { AppEnv } from './types'

const SESSION_COOKIE = 'session'

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const row = await c.env.DB.prepare(
    'SELECT s.user_id, s.expires_at FROM sessions s WHERE s.id = ?'
  )
    .bind(token)
    .first<{ user_id: string; expires_at: string }>()

  if (!row) return c.json({ error: 'Unauthorized' }, 401)

  if (new Date(row.expires_at) <= new Date()) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?')
      .bind(token)
      .run()
    return c.json({ error: 'Session expired' }, 401)
  }

  c.set('userId', row.user_id)
  await next()
}

/**
 * Optional variant that also attaches role for contributor checks.
 * Use in routes that need role without extra query in handler.
 */
export async function requireAuthWithRole(c: Context<AppEnv>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  const session = await c.env.DB.prepare(
    'SELECT s.user_id, s.expires_at, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?'
  )
    .bind(token)
    .first<{ user_id: string; expires_at: string; role: string }>()

  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  if (new Date(session.expires_at) <= new Date()) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?')
      .bind(token)
      .run()
    return c.json({ error: 'Session expired' }, 401)
  }

  c.set('userId', session.user_id)
  c.set('userRole', session.role)
  await next()
}
