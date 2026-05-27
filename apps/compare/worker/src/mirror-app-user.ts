import type { D1Database } from '@cloudflare/workers-types'

/**
 * Compare app DB still has `user_id` FKs to `users`. Canonical auth lives in AUTH_DB;
 * mirror a minimal row here so seed/listings FK constraints succeed.
 */
export async function mirrorUserToAppDb(
  db: D1Database,
  user: { id: string; email: string; name?: string | null }
): Promise<void> {
  const now = Date.now()
  const name = user.name?.trim() || user.email.split('@')[0] || 'User'

  await db
    .prepare(
      `INSERT OR IGNORE INTO users (
        id, name, email, emailVerified, createdAt, updatedAt, role, locale
      ) VALUES (?, ?, ?, 1, ?, ?, 'user', 'en')`
    )
    .bind(user.id, name, user.email, now, now)
    .run()
}
