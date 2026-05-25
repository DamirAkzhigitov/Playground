import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { requireAuth } from '../middleware'
import type { AppEnv } from '../types'
import { sendGmailMessage } from './gmailApi'
import {
  buildGoogleAuthUrl,
  consumeOAuthState,
  createOAuthState,
  exchangeCodeForTokens,
  fetchGoogleAccountEmail,
  accountNeedsReconnect,
  getGmailAccount,
  getValidAccessToken,
  GMAIL_OAUTH_SCOPES,
  redirectUriFromRequest,
  resolvePublicOrigin,
  type OriginResolveOptions
} from './oauth'
import { encryptToken } from './tokenCrypto'

function originOptions(c: Context<AppEnv>): OriginResolveOptions {
  return {
    publicOrigin: c.env.APP_PUBLIC_ORIGIN,
    forwardedHost: c.req.header('X-Forwarded-Host'),
    forwardedProto: c.req.header('X-Forwarded-Proto')
  }
}

const sendSchema = z.object({
  to: z.string().trim().min(1).max(2000),
  subject: z.string().trim().min(1).max(998),
  body: z.string().min(1).max(100_000),
  cc: z.string().trim().max(2000).optional(),
  bcc: z.string().trim().max(2000).optional()
})

const gmail = new Hono<AppEnv>()

gmail.get('/status', requireAuth, async (c) => {
  const userId = c.get('userId')
  const account = await getGmailAccount(c.env.DB, userId)
  if (!account) {
    return c.json({ connected: false })
  }
  return c.json({
    connected: true,
    email: account.google_email,
    needsReconnect: accountNeedsReconnect(account.scopes)
  })
})

gmail.get('/connect', requireAuth, async (c) => {
  const userId = c.get('userId')
  const state = await createOAuthState(c.env.DB, userId)
  const redirectUri = redirectUriFromRequest(c.req.url, originOptions(c))
  const url = buildGoogleAuthUrl(c.env.GOOGLE_CLIENT_ID, redirectUri, state)
  return c.redirect(url)
})

gmail.get('/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  const opts = originOptions(c)
  const origin = resolvePublicOrigin(c.req.url, opts)
  const successRedirect = `${origin}/?gmail=connected`
  const errorRedirect = `${origin}/?gmail=error`

  if (error || !code || !state) {
    return c.redirect(errorRedirect)
  }

  const userId = await consumeOAuthState(c.env.DB, state)
  if (!userId) {
    return c.redirect(errorRedirect)
  }

  try {
    const redirectUri = redirectUriFromRequest(c.req.url, opts)
    const tokens = await exchangeCodeForTokens(
      code,
      c.env.GOOGLE_CLIENT_ID,
      c.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const googleEmail = await fetchGoogleAccountEmail(tokens.accessToken)
    const now = new Date().toISOString()
    const refreshEnc = await encryptToken(
      tokens.refreshToken,
      c.env.TOKEN_ENCRYPTION_KEY
    )
    const accessEnc = await encryptToken(
      tokens.accessToken,
      c.env.TOKEN_ENCRYPTION_KEY
    )
    const expiresAt = new Date(
      Date.now() + tokens.expiresIn * 1000
    ).toISOString()

    await c.env.DB.prepare(
      `INSERT INTO gmail_accounts (
        user_id, google_email, refresh_token_enc, access_token_enc,
        access_expires_at, scopes, connected_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        google_email = excluded.google_email,
        refresh_token_enc = excluded.refresh_token_enc,
        access_token_enc = excluded.access_token_enc,
        access_expires_at = excluded.access_expires_at,
        scopes = excluded.scopes,
        updated_at = excluded.updated_at`
    )
      .bind(
        userId,
        googleEmail,
        refreshEnc,
        accessEnc,
        expiresAt,
        GMAIL_OAUTH_SCOPES,
        now,
        now
      )
      .run()

    return c.redirect(successRedirect)
  } catch (err) {
    console.error('Gmail OAuth callback failed', err)
    return c.redirect(errorRedirect)
  }
})

gmail.post('/disconnect', requireAuth, async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM gmail_accounts WHERE user_id = ?')
    .bind(userId)
    .run()
  return c.body(null, 204)
})

gmail.post('/send', requireAuth, async (c) => {
  const userId = c.get('userId')
  const payload = sendSchema.parse(await c.req.json())

  const account = await getGmailAccount(c.env.DB, userId)
  if (!account) {
    return c.json({ error: 'Gmail is not connected' }, 400)
  }
  if (accountNeedsReconnect(account.scopes)) {
    return c.json(
      {
        error:
          'Gmail needs reconnect for inbox access. Use Connect Gmail again.'
      },
      403
    )
  }

  const accessToken = await getValidAccessToken(
    c.env.DB,
    account,
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET,
    c.env.TOKEN_ENCRYPTION_KEY
  )

  const result = await sendGmailMessage(accessToken, payload)
  return c.json({ ok: true, messageId: result.id })
})

export { gmail }
