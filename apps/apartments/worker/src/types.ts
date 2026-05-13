export type Bindings = {
  ASSETS: Fetcher
  DB: D1Database
  PHOTOS: R2Bucket
  /** wrangler secret put OPENAI_API_KEY — server-side only, never exposed to the client */
  OPENAI_API_KEY?: string
  /** Optional override (defaults to gpt-4o-mini in code). */
  OPENAI_LISTING_MODEL?: string
}

export type Variables = {
  userId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
