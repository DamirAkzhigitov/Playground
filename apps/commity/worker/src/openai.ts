import {
  collectInboxEmailsFromTool,
  mergeInboxEmails,
  type InboxEmail
} from './gmail/inboxEmailPayload'
import { executeInboxTool } from './gmail/inboxTools'
import { loggedFetch } from './lib/localLogger'

const OPENAI_BASE = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const MAX_TOOL_ROUNDS = 5

export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessageInput = {
  role: ChatRole
  content: string
}

export type EmailDraft = {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
}

export type ChatCompletionResult = {
  content: string
  emailDraft?: EmailDraft
  inboxEmails?: InboxEmail[]
  needsReconnect?: boolean
}

export type GmailChatContext = {
  getAccessToken: () => Promise<string>
}

const SYSTEM_PROMPT = `You are Commity, a helpful personal assistant with optional Gmail access.

Email composition:
- When the user wants to write or send an email, call prepare_email with a complete draft.
- Never claim an email was sent — the user must review and confirm sending on the draft card.

Inbox (when Gmail tools are available):
- Use search_emails to find messages (Gmail search syntax in q, e.g. from:alice@example.com is:unread).
- Use get_email for details on a specific messageId from search results.
- Use star_email to favorite (star) or unstar messages.
- Use trash_email to move messages to Trash (default for "remove" or "delete" unless the user explicitly asks for permanent deletion).
- Use delete_email_permanently only when the user clearly asks to permanently delete with no recovery.
- After search_emails or get_email, the app shows email cards with full metadata — do not repeat subject/from/date/snippet in text. You may add a short follow-up (context, next step, or answer in the user's language).
- If search_emails or get_email returned messages successfully, never say the search failed or cite date/message-ID errors; the cards are the result.
- When the user will act on a message next (star, trash, etc.), your later replies may reference messageId.

If the request is not about email, respond normally without using tools.`

const PREPARE_EMAIL_TOOL = {
  type: 'function' as const,
  function: {
    name: 'prepare_email',
    description:
      'Prepare an email draft for the user to review before sending. Use when the user asks to write, compose, or send an email.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description:
            'Recipient email address(es), comma-separated if multiple'
        },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Plain-text email body' },
        cc: {
          type: 'string',
          description: 'Optional CC addresses, comma-separated'
        },
        bcc: {
          type: 'string',
          description: 'Optional BCC addresses, comma-separated'
        }
      },
      required: ['to', 'subject', 'body'],
      additionalProperties: false
    }
  }
}

const INBOX_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_emails',
      description:
        'Search the user Gmail inbox. Returns message summaries with messageId.',
      parameters: {
        type: 'object',
        properties: {
          q: {
            type: 'string',
            description:
              'Gmail search query (e.g. from:bob@example.com newer_than:7d)'
          },
          maxResults: {
            type: 'number',
            description: 'Max messages to return (server caps at 15)'
          },
          labelIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional label IDs to filter (e.g. INBOX, STARRED)'
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_email',
      description: 'Get metadata for one message by messageId.',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string', description: 'Gmail message ID' }
        },
        required: ['messageId'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'star_email',
      description: 'Star or unstar a message (favorite).',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
          starred: {
            type: 'boolean',
            description: 'true to star, false to remove star'
          }
        },
        required: ['messageId'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'trash_email',
      description: 'Move a message to Trash (recoverable in Gmail).',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string' }
        },
        required: ['messageId'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'untrash_email',
      description: 'Restore a message from Trash.',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string' }
        },
        required: ['messageId'],
        additionalProperties: false
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_email_permanently',
      description:
        'Permanently delete a message. Only when the user explicitly requests permanent deletion.',
      parameters: {
        type: 'object',
        properties: {
          messageId: { type: 'string' }
        },
        required: ['messageId'],
        additionalProperties: false
      }
    }
  }
]

type OpenAIToolCall = {
  id?: string
  type?: string
  function?: { name?: string; arguments?: string }
}

type OpenAIChatMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls: OpenAIToolCall[]
    }
  | { role: 'tool'; tool_call_id: string; content: string }

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      role?: string
      content?: string | null
      tool_calls?: OpenAIToolCall[]
    }
    finish_reason?: string
  }>
  error?: { message?: string }
}

/** False "search failed" replies the model sometimes emits despite ok tool results. */
export function isContradictoryInboxFailureReply(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return (
    /\bit seems there was an error\b/i.test(t) ||
    /\berror with the (date|message)/i.test(t)
  )
}

/**
 * Final assistant text for the client. Inbox cards carry metadata; model text
 * may add a short follow-up. Drop only replies that falsely claim failure when
 * we already have messages to show.
 */
export function resolveChatResponseContent(
  modelContent: string,
  options: { inboxEmails: InboxEmail[]; emailDraft?: EmailDraft }
): string {
  const trimmed = modelContent.trim()
  const { inboxEmails, emailDraft } = options

  const defaultContent = emailDraft
    ? "I've prepared an email draft for you to review below."
    : inboxEmails.length > 0
      ? `Found ${inboxEmails.length} message(s) in your inbox.`
      : ''

  if (
    inboxEmails.length > 0 &&
    !emailDraft &&
    isContradictoryInboxFailureReply(trimmed)
  ) {
    return ''
  }

  return trimmed || defaultContent
}

export function parsePrepareEmailArgs(raw: string): EmailDraft | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof parsed.to !== 'string' ||
      !parsed.to.trim() ||
      typeof parsed.subject !== 'string' ||
      !parsed.subject.trim() ||
      typeof parsed.body !== 'string' ||
      !parsed.body.trim()
    ) {
      return null
    }
    const draft: EmailDraft = {
      to: parsed.to.trim(),
      subject: parsed.subject.trim(),
      body: parsed.body.trim()
    }
    if (typeof parsed.cc === 'string' && parsed.cc.trim()) {
      draft.cc = parsed.cc.trim()
    }
    if (typeof parsed.bcc === 'string' && parsed.bcc.trim()) {
      draft.bcc = parsed.bcc.trim()
    }
    return draft
  } catch {
    return null
  }
}

function extractEmailDraft(
  toolCalls: OpenAIToolCall[] | undefined
): EmailDraft | undefined {
  if (!toolCalls?.length) return undefined
  for (const call of toolCalls) {
    if (call.function?.name !== 'prepare_email') continue
    const args = call.function.arguments
    if (typeof args !== 'string') continue
    const draft = parsePrepareEmailArgs(args)
    if (draft) return draft
  }
  return undefined
}

function toolsForContext(gmail?: GmailChatContext) {
  if (gmail) {
    return [PREPARE_EMAIL_TOOL, ...INBOX_TOOLS]
  }
  return [PREPARE_EMAIL_TOOL]
}

async function callOpenAI(
  apiKey: string,
  model: string,
  messages: OpenAIChatMessage[],
  gmail?: GmailChatContext
): Promise<OpenAIChatResponse> {
  const response = await loggedFetch(
    'openai.chat.completions',
    `${OPENAI_BASE}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        tools: toolsForContext(gmail),
        tool_choice: 'auto'
      })
    }
  )

  const body = (await response.json()) as OpenAIChatResponse
  if (!response.ok) {
    const detail =
      body.error?.message ?? `OpenAI request failed (${response.status})`
    throw new Error(detail)
  }
  return body
}

async function runToolCalls(
  toolCalls: OpenAIToolCall[],
  gmail: GmailChatContext
): Promise<{
  toolMessages: Array<{ role: 'tool'; tool_call_id: string; content: string }>
  needsReconnect: boolean
  inboxEmails: InboxEmail[]
}> {
  const accessToken = await gmail.getAccessToken()
  const toolMessages: Array<{
    role: 'tool'
    tool_call_id: string
    content: string
  }> = []
  let needsReconnect = false
  const inboxEmails: InboxEmail[] = []

  for (const call of toolCalls) {
    const id = call.id ?? ''
    const name = call.function?.name ?? ''
    const args = call.function?.arguments ?? '{}'

    if (name === 'prepare_email') {
      toolMessages.push({
        role: 'tool',
        tool_call_id: id,
        content: JSON.stringify({
          ok: true,
          message: 'Draft prepared for user review in the app.'
        })
      })
      continue
    }

    const result = await executeInboxTool(accessToken, name, args)
    if (result.ok === false && result.needsReconnect) needsReconnect = true
    if (result.ok) {
      inboxEmails.push(...collectInboxEmailsFromTool(name, result.data))
    }
    toolMessages.push({
      role: 'tool',
      tool_call_id: id,
      content: JSON.stringify(
        result.ok ? { ok: true, data: result.data } : result
      )
    })
  }

  return { toolMessages, needsReconnect, inboxEmails }
}

export async function completeChat(
  apiKey: string,
  model: string | undefined,
  messages: ChatMessageInput[],
  options?: { gmail?: GmailChatContext }
): Promise<ChatCompletionResult> {
  const resolvedModel = model?.trim() || DEFAULT_MODEL
  const openaiMessages: OpenAIChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ]

  let emailDraft: EmailDraft | undefined
  let inboxEmails: InboxEmail[] = []
  let needsReconnect = false

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const body = await callOpenAI(
      apiKey,
      resolvedModel,
      openaiMessages,
      options?.gmail
    )

    const choice = body.choices?.[0]
    const message = choice?.message
    const toolCalls = message?.tool_calls

    if (choice?.finish_reason === 'tool_calls' && toolCalls?.length) {
      const draft = extractEmailDraft(toolCalls)
      if (draft) emailDraft = draft

      openaiMessages.push({
        role: 'assistant',
        content: message?.content ?? null,
        tool_calls: toolCalls
      })

      if (options?.gmail) {
        const {
          toolMessages,
          needsReconnect: reconnect,
          inboxEmails: roundEmails
        } = await runToolCalls(toolCalls, options.gmail)
        if (reconnect) needsReconnect = true
        inboxEmails = mergeInboxEmails(inboxEmails, roundEmails)
        openaiMessages.push(...toolMessages)
      } else {
        for (const call of toolCalls) {
          if (call.function?.name === 'prepare_email') {
            openaiMessages.push({
              role: 'tool',
              tool_call_id: call.id ?? '',
              content: JSON.stringify({
                ok: true,
                message: 'Draft prepared for user review in the app.'
              })
            })
          }
        }
      }
      continue
    }

    const content =
      typeof message?.content === 'string' ? message.content.trim() : ''

    if (!content && !emailDraft && inboxEmails.length === 0) {
      throw new Error('OpenAI returned an empty response')
    }

    return {
      content: resolveChatResponseContent(content, { inboxEmails, emailDraft }),
      emailDraft,
      ...(inboxEmails.length > 0 ? { inboxEmails } : {}),
      ...(needsReconnect ? { needsReconnect: true } : {})
    }
  }

  throw new Error('Too many tool call rounds')
}
