import type { D1Database } from '@cloudflare/workers-types'

export type AuthDb = D1Database

export type AuthVariables = {
  userId: string
  userRole?: string
}

export type AuthBindings = {
  DB: D1Database
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput

export type UserRow = Record<string, unknown> & {
  id: string
  email: string
  password_hash?: string
  created_at: string
}

export type AuthHooks = {
  insertUser: (
    db: AuthDb,
    args: { userId: string; email: string; passwordHash: string; now: string }
  ) => Promise<void>
  onAfterRegister?: (db: AuthDb, userId: string) => Promise<void>
  selectUserForLogin: (db: AuthDb, email: string) => Promise<UserRow | null>
  selectUserForMe: (db: AuthDb, userId: string) => Promise<UserRow | null>
  formatAuthUser: (row: UserRow) => Record<string, unknown>
  /** Optional cookie domain for SSO across subdomains */
  sessionCookieOptions?: import('./session.js').SessionCookieOptions
}
