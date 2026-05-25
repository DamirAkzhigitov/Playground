import { Hono } from 'hono'
import { z } from 'zod'
import {
  accountNeedsReconnect,
  getGmailAccount,
  getValidAccessToken
} from '../gmail/oauth'
import { completeChat } from '../openai'
import { requireAuth } from '../middleware'
import type { AppEnv } from '../types'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(32_000)
})

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20)
})

const chat = new Hono<AppEnv>()

chat.post('/', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { messages } = chatSchema.parse(await c.req.json())

  const gmailAccount = await getGmailAccount(c.env.DB, userId)
  const gmailConnected = Boolean(gmailAccount)
  const needsReconnect = gmailAccount
    ? accountNeedsReconnect(gmailAccount.scopes)
    : false

  const gmailContext =
    gmailAccount && !needsReconnect
      ? {
          getAccessToken: () =>
            getValidAccessToken(
              c.env.DB,
              gmailAccount,
              c.env.GOOGLE_CLIENT_ID,
              c.env.GOOGLE_CLIENT_SECRET,
              c.env.TOKEN_ENCRYPTION_KEY
            )
        }
      : undefined

  const result = await completeChat(
    c.env.OPENAI_API_KEY,
    c.env.OPENAI_MODEL,
    messages,
    { gmail: gmailContext }
  )

  return c.json({
    message: { role: 'assistant' as const, content: result.content },
    ...(result.emailDraft ? { emailDraft: result.emailDraft } : {}),
    ...(result.inboxEmails?.length ? { inboxEmails: result.inboxEmails } : {}),
    ...(result.emailDraft && !gmailConnected ? { gmailRequired: true } : {}),
    ...(needsReconnect || result.needsReconnect ? { needsReconnect: true } : {})
  })
})

export { chat }
