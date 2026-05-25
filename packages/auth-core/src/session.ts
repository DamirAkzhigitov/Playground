import { setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'

export const SESSION_COOKIE = 'session'
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60

export type SessionCookieOptions = {
  /** Set for cross-subdomain SSO (e.g. `.da-mr.com`). Omit for host-only cookies. */
  domain?: string
}

export function setSessionCookie(
  c: Context,
  token: string,
  options?: SessionCookieOptions
) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    ...(options?.domain ? { domain: options.domain } : {})
  })
}

export function clearSessionCookie(c: Context, options?: SessionCookieOptions) {
  deleteCookie(c, SESSION_COOKIE, {
    path: '/',
    ...(options?.domain ? { domain: options.domain } : {})
  })
}

export function sessionExpiresAt(): string {
  return new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString()
}
