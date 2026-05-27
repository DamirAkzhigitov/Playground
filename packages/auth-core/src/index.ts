export { getAuthDatabase } from './database.js'
export type { AuthDatabaseBindings } from './database.js'
export { createPlaygroundAuth } from './create-auth.js'
export type {
  AuthBindings as CreateAuthBindings,
  CreatePlaygroundAuthOptions,
  PlaygroundAuth
} from './create-auth.js'
export { mountAuthHandler } from './handler.js'
export {
  createSessionMiddleware,
  requireAuth,
  requireAuthWithRole,
  hasMinimumRole
} from './middleware.js'
export type { AuthEnv, UserRole } from './middleware.js'
export {
  buildPlaygroundSsoOptions,
  DEFAULT_SSO_COOKIE_DOMAIN,
  mergeBetterAuthAdvanced,
  resolveSsoCookieDomain
} from './sso.js'
export type { PlaygroundSsoConfig } from './sso.js'
export { authSchema } from './schema.js'
export type {
  AuthBindings,
  AuthDb,
  AuthVariables,
  LoginInput,
  RegisterInput
} from './types.js'
