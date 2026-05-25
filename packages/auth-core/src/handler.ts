import type { Hono } from 'hono'

import type { PlaygroundAuth } from './create-auth.js'
import type { AuthBindings, AuthVariables } from './types.js'

/** Mount Better Auth on `/api/auth/*` (matches basePath). */
export function mountAuthHandler<B extends AuthBindings>(
  app: Hono<{ Bindings: B; Variables: AuthVariables }>,
  getAuth: (env: B) => PlaygroundAuth
) {
  app.on(['GET', 'POST'], '/api/auth/*', (c) => {
    return getAuth(c.env).handler(c.req.raw)
  })
}
