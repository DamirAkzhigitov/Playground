export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
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
