import type { Context } from 'hono'

import type { AppEnv } from './types'
import { mirrorUserToAppDb } from './mirror-app-user'

/** Mirror auth user on first authenticated compare API use. */
export async function ensureCompareAppUser(c: Context<AppEnv>): Promise<void> {
  const userId = c.get('userId')
  const authUser = c.get('authUser')
  if (!userId || !authUser) return

  const row = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?')
    .bind(userId)
    .first()

  if (row) return

  const email =
    typeof authUser.email === 'string' ? authUser.email : 'user@local.test'
  const name = typeof authUser.name === 'string' ? authUser.name : null

  await mirrorUserToAppDb(c.env.DB, { id: userId, email, name })
}
