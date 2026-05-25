export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
}

export type Variables = {
  userId: string
  userRole?: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
