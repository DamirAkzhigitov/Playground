import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { SESSION_COOKIE } from './session.js'
import type { AuthBindings, AuthVariables } from './types.js'

export type AuthEnv = {
  Bindings: AuthBindings
  Variables: AuthVariables
}

export async function requireAuth<E extends AuthEnv>(
  c: Context<E>,
  next: Next
) {
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
 * Like requireAuth but also sets userRole from a JOIN on users.
 */
export async function requireAuthWithRole<E extends AuthEnv>(
  c: Context<E>,
  next: Next
) {
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

export type UserRole = 'user' | 'contributor' | 'admin'

const roleRank: Record<UserRole, number> = {
  user: 0,
  contributor: 1,
  admin: 2
}

export function hasMinimumRole(userRole: string, required: UserRole): boolean {
  const rank = roleRank[userRole as UserRole]
  const need = roleRank[required]
  if (rank === undefined || need === undefined) return false
  return rank >= need
}
