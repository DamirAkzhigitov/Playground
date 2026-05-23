export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
  OPENAI_API_KEY: string
  OPENAI_MODEL?: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  TOKEN_ENCRYPTION_KEY: string
  /** Browser-facing origin when API is behind a dev proxy (e.g. http://localhost:3003). */
  APP_PUBLIC_ORIGIN?: string
}

export type Variables = {
  userId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
