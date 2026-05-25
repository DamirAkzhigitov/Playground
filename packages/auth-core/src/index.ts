export { hashPassword, verifyPassword } from './crypto.js'
export {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  setSessionCookie,
  clearSessionCookie,
  sessionExpiresAt
} from './session.js'
export type { SessionCookieOptions } from './session.js'
export {
  requireAuth,
  requireAuthWithRole,
  hasMinimumRole
} from './middleware.js'
export type { AuthEnv, UserRole } from './middleware.js'
export { createAuthRoutes } from './routes.js'
export type { CreateAuthRoutesOptions } from './routes.js'
export type {
  AuthBindings,
  AuthDb,
  AuthHooks,
  AuthVariables,
  LoginInput,
  RegisterInput,
  UserRow
} from './types.js'
