export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
  PHOTOS: R2Bucket
}

export type Variables = {
  userId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
