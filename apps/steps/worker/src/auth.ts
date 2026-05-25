import { createAuthRoutes } from '@playground/auth-core'
import type { AppEnv } from './types'

const ROLES = ['user', 'contributor', 'admin'] as const
type Role = (typeof ROLES)[number]

function asRole(role: string): Role {
  return ROLES.includes(role as Role) ? (role as Role) : 'user'
}

export const auth = createAuthRoutes<AppEnv>({
  insertUser: async (db, { userId, email, passwordHash, now }) => {
    await db
      .prepare(
        'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(userId, email, passwordHash, 'user', now)
      .run()
  },
  selectUserForLogin: async (db, email) => {
    return db
      .prepare(
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
  },
  selectUserForMe: async (db, userId) => {
    return db
      .prepare('SELECT id, email, role, created_at FROM users WHERE id = ?')
      .bind(userId)
      .first<{
        id: string
        email: string
        role: string
        created_at: string
      }>()
  },
  formatAuthUser: (row) => ({
    id: row.id,
    email: row.email,
    role: asRole(row.role as string),
    createdAt: row.created_at
  })
})
