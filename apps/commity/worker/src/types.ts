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
  /** Local dev only: POST logs to LOCAL_LOG_URL (true | 1 | yes). */
  LOCAL_LOGS?: string
  /** Local log sink; default http://127.0.0.1:8799/log (localLogServer.mjs). */
  LOCAL_LOG_URL?: string
}

export type Variables = {
  userId: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
