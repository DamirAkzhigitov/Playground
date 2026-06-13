import type { Context } from 'hono'

import type { AppEnv } from './types'
import { mirrorUserToAppDb } from './mirror-app-user'
import { seedDefaultData } from './seed'

/** Mirror auth user + seed defaults on first authenticated compare API use. */
export async function ensureCompareAppUser(c: Context<AppEnv>): Promise<void> {
  const userId = c.get('userId')
  const authUser = c.get('authUser')
  if (!userId || !authUser) return

  const row = await c.env.DB.prepare(
    'SELECT COUNT(*) AS count FROM categories WHERE user_id = ?'
  )
    .bind(userId)
    .first<{ count: number }>()

  if (row && row.count > 0) return

  const email =
    typeof authUser.email === 'string' ? authUser.email : 'user@local.test'
  const name = typeof authUser.name === 'string' ? authUser.name : null

  await mirrorUserToAppDb(c.env.DB, { id: userId, email, name })
  await seedDefaultData(c.env.DB, userId)
}
