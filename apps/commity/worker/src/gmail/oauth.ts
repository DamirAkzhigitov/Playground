import { loggedFetch } from '../lib/localLogger'
import { decryptToken, encryptToken } from './tokenCrypto'

/** Read, search, star, trash, and send mail (replaces narrow gmail.send). */
export const GMAIL_MODIFY_SCOPE = 'https://www.googleapis.com/auth/gmail.modify'
/** Needed to show which Google account is connected. */
export const USERINFO_EMAIL_SCOPE =
  'https://www.googleapis.com/auth/userinfo.email'
export const GMAIL_OAUTH_SCOPES = `${GMAIL_MODIFY_SCOPE} ${USERINFO_EMAIL_SCOPE}`

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const STATE_TTL_MS = 10 * 60 * 1000

export type GmailAccountRow = {
  user_id: string
  google_email: string
  refresh_token_enc: string
  access_token_enc: string | null
  access_expires_at: string | null
  scopes: string
  connected_at: string
  updated_at: string
}

export type OriginResolveOptions = {
  publicOrigin?: string
  forwardedHost?: string | null
  forwardedProto?: string | null
}

/** True when the stored grant predates gmail.modify (send-only scope). */
export function accountNeedsReconnect(scopes: string): boolean {
  return !scopes.includes('gmail.modify')
}

/** First non-empty forwarded value (proxies may send comma-separated lists). */
function firstHeaderValue(
  value: string | null | undefined
): string | undefined {
  const first = value?.split(',')[0]?.trim()
  return first || undefined
}

export function resolvePublicOrigin(
  requestUrl: string,
  options?: OriginResolveOptions
): string {
  const configured = options?.publicOrigin?.trim().replace(/\/$/, '')
  if (configured) return configured

  const host = firstHeaderValue(options?.forwardedHost)
  if (host) {
    const proto =
      firstHeaderValue(options?.forwardedProto) ??
      (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }

  return new URL(requestUrl).origin
}

export function redirectUriFromRequest(
  requestUrl: string,
  options?: OriginResolveOptions
): string {
  return `${resolvePublicOrigin(requestUrl, options)}/api/gmail/callback`
}

export function buildGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function createOAuthState(
  db: D1Database,
  userId: string
): Promise<string> {
  const state = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString()
  await db
    .prepare(
      'INSERT INTO oauth_states (state, user_id, expires_at) VALUES (?, ?, ?)'
    )
    .bind(state, userId, expiresAt)
    .run()
  return state
}

export async function consumeOAuthState(
  db: D1Database,
  state: string
): Promise<string | null> {
  const row = await db
    .prepare('SELECT user_id, expires_at FROM oauth_states WHERE state = ?')
    .bind(state)
    .first<{ user_id: string; expires_at: string }>()

  await db.prepare('DELETE FROM oauth_states WHERE state = ?').bind(state).run()

  if (!row) return null
  if (new Date(row.expires_at) <= new Date()) return null
  return row.user_id
}

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await loggedFetch('google.oauth.token', GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })

  const body = (await response.json()) as TokenResponse
  if (!response.ok || !body.access_token || !body.refresh_token) {
    const detail =
      body.error_description ?? body.error ?? 'Token exchange failed'
    throw new Error(detail)
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresIn: body.expires_in ?? 3600
  }
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await loggedFetch('google.oauth.refresh', GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    })
  })

  const body = (await response.json()) as TokenResponse
  if (!response.ok || !body.access_token) {
    const detail =
      body.error_description ?? body.error ?? 'Token refresh failed'
    throw new Error(detail)
  }

  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in ?? 3600
  }
}

export async function fetchGoogleAccountEmail(
  accessToken: string
): Promise<string> {
  const response = await loggedFetch('google.userinfo', GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const body = (await response.json()) as {
    email?: string
    error?: string
    error_description?: string
  }
  if (!response.ok || !body.email) {
    throw new Error(
      body.error_description ??
        body.error ??
        'Failed to load Google account email'
    )
  }
  return body.email
}

export async function getGmailAccount(
  db: D1Database,
  userId: string
): Promise<GmailAccountRow | null> {
  return db
    .prepare('SELECT * FROM gmail_accounts WHERE user_id = ?')
    .bind(userId)
    .first<GmailAccountRow>()
}

export async function getValidAccessToken(
  db: D1Database,
  account: GmailAccountRow,
  clientId: string,
  clientSecret: string,
  encryptionKey: string
): Promise<string> {
  const now = Date.now()
  if (
    account.access_token_enc &&
    account.access_expires_at &&
    new Date(account.access_expires_at).getTime() > now + 60_000
  ) {
    return decryptToken(account.access_token_enc, encryptionKey)
  }

  const refreshToken = await decryptToken(
    account.refresh_token_enc,
    encryptionKey
  )
  const { accessToken, expiresIn } = await refreshAccessToken(
    refreshToken,
    clientId,
    clientSecret
  )

  const accessEnc = await encryptToken(accessToken, encryptionKey)
  const expiresAt = new Date(now + expiresIn * 1000).toISOString()
  const updatedAt = new Date().toISOString()

  await db
    .prepare(
      `UPDATE gmail_accounts
       SET access_token_enc = ?, access_expires_at = ?, updated_at = ?
       WHERE user_id = ?`
    )
    .bind(accessEnc, expiresAt, updatedAt, account.user_id)
    .run()

  return accessToken
}
