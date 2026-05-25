import type { D1Database } from '@cloudflare/workers-types'

export type AuthDb = D1Database

export type AuthVariables = {
  userId?: string
  userRole?: string
  authUser?: Record<string, unknown> | null
}

export type AuthBindings = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  FACEBOOK_CLIENT_ID?: string
  FACEBOOK_CLIENT_SECRET?: string
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = LoginInput
