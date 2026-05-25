export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
  PHOTOS: R2Bucket
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  BETTER_AUTH_TRUSTED_ORIGINS?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  FACEBOOK_CLIENT_ID?: string
  FACEBOOK_CLIENT_SECRET?: string
}

export type Variables = {
  userId?: string
  userRole?: string
  authUser?: Record<string, unknown> | null
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
