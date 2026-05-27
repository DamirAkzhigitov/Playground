import type { D1Database } from '@cloudflare/workers-types'

/** Bindings that may carry a dedicated shared auth D1 (`AUTH_DB`) plus app `DB`. */
export type AuthDatabaseBindings = {
  AUTH_DB?: D1Database
  DB: D1Database
}

/** Better Auth + session storage — prefers `AUTH_DB` when configured for SSO. */
export function getAuthDatabase(env: AuthDatabaseBindings): D1Database {
  return env.AUTH_DB ?? env.DB
}
