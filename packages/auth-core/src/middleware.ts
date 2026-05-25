import type { Context, MiddlewareHandler, Next } from 'hono'

import type { AuthBindings, AuthVariables } from './types.js'
import type { PlaygroundAuth } from './create-auth.js'

export type AuthEnv = {
  Bindings: AuthBindings
  Variables: AuthVariables
}

type AppContext<B extends AuthBindings> = Context<{
  Bindings: B
  Variables: AuthVariables
}>

export function createSessionMiddleware<B extends AuthBindings>(
  getAuth: (env: B) => PlaygroundAuth
): MiddlewareHandler<{ Bindings: B; Variables: AuthVariables }> {
  return async (c: AppContext<B>, next: Next) => {
    const auth = getAuth(c.env)
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      c.set('authUser', null)
      await next()
      return
    }

    c.set('userId', session.user.id)
    c.set('userRole', (session.user as { role?: string }).role)
    c.set('authUser', session.user)
    await next()
  }
}

export async function requireAuth<B extends AuthBindings>(
  c: AppContext<B>,
  next: Next
) {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  await next()
}

export async function requireAuthWithRole<B extends AuthBindings>(
  c: AppContext<B>,
  next: Next
) {
  const userId = c.get('userId')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
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
